import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';
import { Stethoscope, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      position: 'relative',
      overflow: 'hidden',
      padding: '16px'
    }}>
      {/* Dynamic Background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '25%', left: '25%', width: '50vw', height: '50vw', maxWidth: '800px', maxHeight: '800px',
          background: 'rgba(245, 158, 11, 0.05)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-50%, -50%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '25%', right: '25%', width: '40vw', height: '40vw', maxWidth: '600px', maxHeight: '600px',
          background: 'rgba(217, 119, 6, 0.05)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(25%, 25%)'
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Main Glass Card */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px',
        background: 'rgba(20, 20, 24, 0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '28px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)', padding: '40px 32px'
      }}>
        
        {/* Header/Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(245, 158, 11, 0.2)', filter: 'blur(16px)', borderRadius: '50%', transform: 'scale(1.1)'
            }} />
            <div style={{
              position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Stethoscope size={32} color="#ffffff" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.5px', margin: '0 0 6px 0' }}>
            MedRep Planner
          </h1>
          <p style={{ fontSize: '14.5px', color: '#8e8e9e', margin: 0 }}>
            Sign in to manage your territory
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 500, color: '#b0b0bc', marginLeft: '4px' }}>
              Email address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                color: focused === 'email' ? '#f59e0b' : '#5a5a68', transition: 'color 0.2s'
              }}>
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your email"
                style={{
                  width: '100%', backgroundColor: '#0a0a0f', color: '#ffffff', fontSize: '15px',
                  padding: '16px 16px 16px 44px', borderRadius: '12px', outline: 'none',
                  border: focused === 'email' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: focused === 'email' ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none',
                  transition: 'all 0.2s', minHeight: '52px'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '4px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 500, color: '#b0b0bc' }}>
                Password
              </label>
              <a href="#" style={{ fontSize: '12.5px', fontWeight: 500, color: '#f59e0b', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                color: focused === 'password' ? '#f59e0b' : '#5a5a68', transition: 'color 0.2s'
              }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                style={{
                  width: '100%', backgroundColor: '#0a0a0f', color: '#ffffff', fontSize: '15px',
                  padding: '16px 44px 16px 44px', borderRadius: '12px', outline: 'none',
                  border: focused === 'password' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: focused === 'password' ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none',
                  transition: 'all 0.2s', minHeight: '52px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '4px', top: '4px', bottom: '4px', width: '44px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent',
                  border: 'none', color: '#5a5a68', cursor: 'pointer', outline: 'none'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', marginTop: '6px', flexShrink: 0 }} />
              <p style={{ margin: 0, color: '#f87171', fontSize: '13.5px', fontWeight: 500, lineHeight: 1.4 }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', height: '54px', marginTop: '8px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              color: '#ffffff', fontSize: '15.5px', fontWeight: 600, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)', opacity: isLoading ? 0.7 : 1,
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.8)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ height: '1px', width: '40px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <p style={{ margin: 0, color: '#5a5a68', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            MedRep System
          </p>
          <div style={{ height: '1px', width: '40px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </div>
  );
}
