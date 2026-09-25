import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_Abo0K1Uwk',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4sopf4t2bab81aa73kisb4plm8'
};
const userPool = new CognitoUserPool(poolData);

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!isLogin) {
      const attributeList = [];
      const dataEmail = { Name: 'email', Value: formData.email };
      const attributeEmail = new CognitoUserAttribute(dataEmail);
      attributeList.push(attributeEmail);

      userPool.signUp(formData.email, formData.password, attributeList, null, (err, result) => {
        setIsSubmitting(false);
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
          setIsSubmitting(false);
          const accessToken = result.getAccessToken().getJwtToken();
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('userId', formData.email);
          navigate('/');
        },
        onFailure: (err) => {
          setIsSubmitting(false);
          if (err.code === 'UserNotConfirmedException') {
            setError('Account not verified. Please enter the verification code sent to your email.');
            setIsVerifying(true);
          } else {
            setError(err.message || JSON.stringify(err));
          }
        },
      });
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const userData = { Username: formData.email, Pool: userPool };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
      setIsSubmitting(false);
      if (err) {
        setError(err.message || JSON.stringify(err));
        return;
      }
      setIsVerifying(false);
      setIsLogin(true);
      setVerificationCode('');
      alert('Verification successful! You can now authenticate.');
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050711] text-zinc-900 dark:text-gray-100 flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white dark:bg-[#080b18]/90 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl relative z-10"
      >
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white transition text-xs mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)] text-black">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white text-center mb-1 tracking-tight">
          {isVerifying ? 'Verify Email' : isLogin ? 'Candidate Access' : 'Create Profile'}
        </h2>
        <p className="text-zinc-500 dark:text-gray-400 text-center mb-8 text-xs">
          {isVerifying ? 'Enter the confirmation code sent to your email address.' : isLogin ? 'Authenticate with AWS Cognito to synchronize your records.' : 'Initialize your competitive assessment profile.'}
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" />
              <input 
                type="text" 
                required
                placeholder="6-Digit Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors tracking-widest text-base font-mono"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer"
            >
              <span>Verify & Complete</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative mb-4">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Candidate Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-xs font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" />
              <input 
                type="email" 
                required
                placeholder="Corporate or Student Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-xs font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" />
              <input 
                type="password" 
                required
                placeholder="Secure Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-xs font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center space-x-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all duration-200 ease-out hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] font-medium text-sm tracking-wide py-2.5 px-4 rounded-xl cursor-pointer mt-4"
            >
              <span>{isLogin ? 'Authenticate' : 'Create Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {!isVerifying && (
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-gray-400">
            {isLogin ? "New candidate? " : "Already registered? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors ml-1"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
