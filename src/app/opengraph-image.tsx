import { ImageResponse } from 'next/og';
export const alt = 'GitHub Signals — Less noise. More signal.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#090d14',
        padding: 80,
        flexDirection: 'column',
        color: '#f7f1eb',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 26, display: 'flex' }}>GitHub Signals.</div>
      <div
        style={{
          fontSize: 100,
          display: 'flex',
          flexDirection: 'column',
          fontWeight: 700,
          letterSpacing: -5,
        }}
      >
        <span>Less noise.</span>
        <span style={{ color: '#ffa05e' }}>More signal.</span>
      </div>
      <div style={{ fontSize: 24, color: '#aaaeb8', display: 'flex' }}>
        Open-source projects worth your time. · githubsignals.com
      </div>
    </div>,
    size,
  );
}
