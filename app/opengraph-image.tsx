import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Ask Cuter - Create Your Valentine'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
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
          background: 'linear-gradient(135deg, #faf5f0 0%, #fecdd3 50%, #fbcfe8 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '120px', display: 'flex' }}>💕</div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#92400e',
              textShadow: '3px 3px 0 white',
              letterSpacing: '-1px',
            }}
          >
            ASK CUTER
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#78716c',
              marginTop: '8px',
            }}
          >
            Create beautiful, shareable valentine cards
          </div>
          <div
            style={{
              marginTop: '24px',
              background: '#dc2626',
              color: 'white',
              padding: '16px 48px',
              borderRadius: '999px',
              fontSize: '24px',
              fontWeight: 600,
            }}
          >
            Create your valentine
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
