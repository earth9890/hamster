import { ImageResponse } from 'next/og';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, rgb(15 15 17), rgb(23 23 27))',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="rgb(249 115 22)"
          viewBox="0 0 24 24"
          style={{ width: '80px', height: '80px' }}
        >
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    ),
    {
      width: 180,
      height: 180,
    }
  );
}
