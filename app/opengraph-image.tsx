import { ImageResponse } from 'next/og'

export const alt = 'Lastcorner — Il motorsport a 360°'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#131318',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,58,58,0.55) 0%, rgba(255,58,58,0) 70%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 14,
              height: 72,
              background: '#FF3A3A',
              borderRadius: 8,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
              LASTCORNER
            </span>
            <span style={{ fontSize: 28, color: '#C3C3C3', marginTop: 4 }}>
              Il motorsport a 360°
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
