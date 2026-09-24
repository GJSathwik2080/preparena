import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxxx',
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxx'
};
const userPool = new CognitoUserPool(poolData);

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!isLogin) {
      const attributeList = [];
      const dataEmail = { Name: 'email', Value: formData.email };
      const attributeEmail = new CognitoUserAttribute(dataEmail);
      attributeList.push(attributeEmail);

      userPool.signUp(formData.email, formData.password, attributeList, null, (err, result) => {
          if (err) {
              setError(err.message || JSON.stringify(err));
              return;
          }
          setIsVerifying(true);
          setError(null);
      });
    } else {
      const authenticationDetails = new AuthenticationDetails({
          Username: formData.email,
          Password: formData.password,
      });

      const userData = {
          Username: formData.email,
          Pool: userPool,
      };
      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
              const accessToken = result.getAccessToken().getJwtToken();
              localStorage.setItem('auth_token', accessToken);
              localStorage.setItem('userId', formData.email);
              navigate('/');
          },
          onFailure: (err) => {
              setError(err.message || JSON.stringify(err));
          },
      });
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError(null);
    const userData = { Username: formData.email, Pool: userPool };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
      if (err) {
        setError(err.message || JSON.stringify(err));
        return;
      }
      setIsVerifying(false);
      setIsLogin(true);
      setVerificationCode('');
      alert('Verification successful! You can now log in.');
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-gray-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-white text-center mb-2">
          {isVerifying ? 'Verify Email' : isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          {isVerifying ? 'Enter the verification code sent to your email.' : isLogin ? 'Enter your credentials to access the Arena.' : 'Join the elite ranks of Prep Arena.'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-400 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                required
                placeholder="Verification Code (e.g. 123456)"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors tracking-widest text-lg font-mono"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg mt-4"
            >
              <span>Verify Account</span>
              <CheckCircle className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg mt-4"
            >
              <span>{isLogin ? 'Authenticate' : 'Initialize Profile'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {!isVerifying && (
          <div className="mt-8 text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already initialized? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
