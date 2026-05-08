import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';

const validateRequest = (schema: AnyZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      files: req.files,
      file: req.file,
      cookies: req.cookies,
    });

    // Write transformed values back so Zod transforms (e.g. string→boolean) take effect.
    // Object.assign merges rather than replaces, so unknown fields are preserved.
    if (parsed.body !== undefined) Object.assign(req.body, parsed.body);
    if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
    if (parsed.params !== undefined) Object.assign(req.params, parsed.params);

    next();
  });
};

export default validateRequest;
