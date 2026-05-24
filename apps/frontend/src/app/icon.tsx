import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, rgb(249 115 22), rgb(234 88 12))',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          color: 'white',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ width: '20px', height: '20px' }}
        >
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
