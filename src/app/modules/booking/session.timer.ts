import { Booking } from './booking.model';
import { emitSessionEvent } from '../../../socketIo';
import { getBusinessNow, getBusinessDayRange } from '../../utils/businessTime';

let timerHandle: NodeJS.Timeout | null = null;

// Track booking IDs that already received a 15-min expiry warning this cycle
const warnedSessions = new Set<string>();

export function computeSessionProgress(
  startTime: string,
  bookingDate: Date,
  duration: number,
): {
  endTime: string;
  timeElapsedMin: number;
  timeRemainingMin: number;
  percentComplete: number;
  isExpired: boolean;
  isEndingSoon: boolean;
} {
  const [h, m] = startTime.split(':').map(Number);
  const start = new Date(bookingDate);
  start.setUTCHours(h, m, 0, 0);

  const end = new Date(start.getTime() + duration * 3_600_000);
  const now = getBusinessNow().getTime();
  const totalMs = duration * 3_600_000;
  const elapsedMs = now - start.getTime();
  const remainingMs = end.getTime() - now;

  return {
    endTime: `${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}`,
    timeElapsedMin: Math.max(0, Math.floor(elapsedMs / 60_000)),
    timeRemainingMin: Math.max(0, Math.ceil(remainingMs / 60_000)),
    percentComplete: Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))),
    isExpired: now >= end.getTime(),
    isEndingSoon: remainingMs > 0 && remainingMs <= 15 * 60_000,
  };
}

async function tick(): Promise<void> {
  try {
    const now = getBusinessNow();
    const { start: todayStart, end: todayEnd } = getBusinessDayRange(now);

    const activeSessions = await Booking.find({
      bookingDate: { $gte: todayStart, $lte: todayEnd },
      status: 'confirmed',
      isDeleted: false,
    })
      .populate('scheduleId', 'timeSlot date')
      .lean({ virtuals: true });

    const liveSessions = [];

    for (const booking of activeSessions) {
      const bookingId = (booking as any)._id.toString();
      const progress = computeSessionProgress(
        booking.startTime as string,
        booking.bookingDate as Date,
        booking.duration as number,
      );

      if (progress.isExpired) {
        await Booking.findByIdAndUpdate(bookingId, { status: 'completed' });
        warnedSessions.delete(bookingId);
        emitSessionEvent('session:auto_completed', {
          bookingId,
          bayNumber: booking.bayNumber,
          customerInfo: booking.customerInfo,
          completedAt: now.toISOString(),
        });
        continue;
      }

      if (progress.isEndingSoon && !warnedSessions.has(bookingId)) {
        warnedSessions.add(bookingId);
        emitSessionEvent('session:expiry_warning', {
          bookingId,
          bayNumber: booking.bayNumber,
          customerInfo: booking.customerInfo,
          timeRemainingMin: progress.timeRemainingMin,
          endTime: progress.endTime,
        });
      }

      const scheduleDoc = (booking as any).scheduleId;
      liveSessions.push({
        bookingId,
        bayNumber: booking.bayNumber,
        slot: {
          startTime: booking.startTime,
          endTime: progress.endTime,
          duration: booking.duration,
          scheduleSlot: scheduleDoc?.timeSlot ?? null,
          scheduleDate: scheduleDoc?.date ?? null,
        },
        customer: {
          name: (booking.customerInfo as any).name,
          phone: (booking.customerInfo as any).phone,
          email: (booking.customerInfo as any).email ?? null,
          type: booking.customerType,
        },
        customerInfo: booking.customerInfo,
        customerType: booking.customerType,
        startTime: booking.startTime,
        duration: booking.duration,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        addOns: booking.addOns,
        notes: (booking as any).notes ?? null,
        ...progress,
      });
    }

    emitSessionEvent('live:tick', {
      sessions: liveSessions,
      activeBays: liveSessions.map((s) => s.bayNumber),
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[SessionTimer] tick error:', err);
  }
}

export function startSessionTimer(): void {
  if (timerHandle) return;
  timerHandle = setInterval(tick, 60_000);
  console.log('[SessionTimer] started — live session events every 60s');
}

export function stopSessionTimer(): void {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}
