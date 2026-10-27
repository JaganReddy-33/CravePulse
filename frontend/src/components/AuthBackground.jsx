import React from 'react';

/**
 * High-performance ambient motion background for authentication pages.
 * Supports continuous looping HD culinary/transit video with smooth fallback
 * to responsive dynamic CSS mesh animations.
 */
const AuthBackground = ({ role = 'CUSTOMER' }) => {
  // Video sources per role
  const videoConfig = {
    CUSTOMER: {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-gourmet-dish-being-prepared-42525-large.mp4',
      poster: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1600&q=80',
      gradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.82) 0%, rgba(30, 27, 75, 0.85) 100%)',
      accentColor: '#ff5c35'
    },
    PARTNER: {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-stirring-food-in-a-pan-with-flames-43093-large.mp4',
      poster: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80',
      gradient: 'linear-gradient(135deg, rgba(20, 16, 12, 0.85) 0%, rgba(38, 20, 8, 0.88) 100%)',
      accentColor: '#f59e0b'
    },
    RIDER: {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-night-traffic-in-a-modern-city-43187-large.mp4',
      poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80',
      gradient: 'linear-gradient(135deg, rgba(10, 15, 29, 0.86) 0%, rgba(6, 44, 30, 0.88) 100%)',
      accentColor: '#00e676'
    },
    ADMIN: {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-data-31911-large.mp4',
      poster: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
      gradient: 'linear-gradient(135deg, rgba(9, 13, 22, 0.88) 0%, rgba(15, 23, 42, 0.92) 100%)',
      accentColor: '#38bdf8'
    }
  };

  const config = videoConfig[role] || videoConfig.CUSTOMER;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 overflow-hidden" 
      style={{ zIndex: 0, pointerEvents: 'none' }}
    >
      {/* Background Video with silent autoplay & seamless loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={config.poster}
        className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
        style={{ filter: 'brightness(0.55) contrast(1.15) saturate(1.2)' }}
      >
        <source src={config.url} type="video/mp4" />
      </video>

      {/* Cinematic Tint & Vignette Gradient Overlay */}
      <div 
        className="position-absolute top-0 start-0 w-100 h-100" 
        style={{
          background: config.gradient,
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)'
        }}
      />

      {/* Floating Ambient Glowing Particle Spheres */}
      <div 
        className="position-absolute rounded-circle blur-3xl opacity-30 animate-pulse"
        style={{
          width: 500,
          height: 500,
          top: '-10%',
          left: '-10%',
          background: `radial-gradient(circle, ${config.accentColor} 0%, transparent 70%)`
        }}
      />
      <div 
        className="position-absolute rounded-circle blur-3xl opacity-20 animate-pulse"
        style={{
          width: 600,
          height: 600,
          bottom: '-15%',
          right: '-10%',
          background: `radial-gradient(circle, ${config.accentColor} 0%, transparent 70%)`,
          animationDuration: '4s'
        }}
      />
    </div>
  );
};

export default AuthBackground;
