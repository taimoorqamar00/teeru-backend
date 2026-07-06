import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
 
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    tls: {
      ciphers: 'SSLv3',
    },
    auth: {
      user: config.nodemailer_host_email,
      pass: config.nodemailer_host_pass,
    },
  });


  

  await transporter.sendMail({
    from: config.nodemailer_host_email,
    to,
    subject,
    text: '',
    html,
  });
};



















