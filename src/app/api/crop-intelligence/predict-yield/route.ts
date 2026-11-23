import { NextRequest } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { formatRouteError } from '@/lib/api-errors';
import { yieldPredictionSchema, formatZodError } from '@/features/crop-intelligence/validations';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = yieldPredictionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 422 });
    }

    const payload = parsed.data;

    // 1. Try FastAPI microservice first (if running on port 8000)
    try {
      const fastApiUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/predict';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const fastApiRes = await fetch(fastApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (fastApiRes.ok) {
        const data = await fastApiRes.json();
        return Response.json({ ...data, source: 'fastapi-service' });
      }
    } catch {
      // FastAPI not running — fallback to direct python runner
    }

    // 2. Direct Python runner fallback using isolated venv python
    const venvParts = ['ml-service', '.venv', 'bin', 'python'];
    const pythonBin = process.env.PYTHON_PATH || path.resolve(process.cwd(), ...venvParts);
    const predictScript = path.resolve(process.cwd(), 'ml-service', 'predict.py');

    try {
      const { stdout } = await execFileAsync(pythonBin, [
        predictScript,
        JSON.stringify(payload),
      ]);

      const result = JSON.parse(stdout.trim());
      if (result.status === 422) {
        return Response.json(result, { status: 422 });
      }
      if (result.status && result.status !== 200) {
        return Response.json(result, { status: result.status });
      }

      return Response.json({ ...result, source: 'direct-ml-pipeline' });
    } catch (execErr: unknown) {
      const msg = execErr instanceof Error ? execErr.message : String(execErr);
      return Response.json(
        {
          error: 'ML prediction failed to execute',
          detail: msg,
          hint: 'Ensure ml-service/.venv is configured and ml-service/train.py has been run.',
        },
        { status: 500 },
      );
    }
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
