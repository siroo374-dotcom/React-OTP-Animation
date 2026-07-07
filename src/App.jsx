import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Shield, Check } from 'lucide-react';
import './App.css';

const OTPBox = ({ index, value, isActive, status, stepSize, onChange, onKeyDown, onPaste, onFocus, inputRef }) => {
  const controls = useAnimation();
  const prevValue = useRef(value);

  // Micro-interactions for typing
  useEffect(() => {
    if (status === "idle" && value !== prevValue.current) {
      if (value !== "") {
        controls.start({
          x: [0, -2, 3, -2, 2, 0],
          scale: [1, 1.05, 1],
          transition: { duration: 0.15, ease: "easeOut" }
        });
      } else if (value === "" && prevValue.current !== "") {
        controls.start({
          x: [0, 2, -2, 0],
          transition: { duration: 0.12, ease: "easeOut" }
        });
      }
      prevValue.current = value;
    }
  }, [value, controls, status]);

  // Premium Slow-Motion Merge Animation
  useEffect(() => {
    if (status === "merging") {
      const xOffset = (2.5 - index) * stepSize; 
      controls.start({
        x: xOffset,
        backgroundColor: "#10b981",
        borderColor: "#10b981",
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
        scale: 0.95, // Slight scale down during travel for a 3D feel
        transition: { 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1] // Custom Apple-like slow ease-out
        }
      });
    } else if (status === "idle") {
      controls.start({
        x: 0,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderColor: "#374151",
        boxShadow: "none",
        scale: 1,
        transition: { duration: 0.3 }
      });
    }
  }, [status, index, controls, stepSize]);

  return (
    <motion.div
      className={`otp-box-wrapper ${isActive && status === 'idle' ? 'active' : ''}`}
      animate={controls}
      whileTap={status === "idle" ? { scale: 0.98 } : {}}
      style={{ zIndex: status === "merging" ? 10 - Math.abs(2.5 - index) : 1 }}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={onPaste}
        onFocus={() => onFocus(index)}
        className="otp-input"
        disabled={status !== "idle"}
        aria-label={`Digit ${index + 1}`}
      />
      
      <AnimatePresence>
        {value && status === "idle" && (
          <motion.span
            className="digit-display"
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState("idle"); 
  const [countdown, setCountdown] = useState(30);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  const inputRefs = useRef([]);

  // Responsive Dimensions Matching CSS variables perfectly
  const isMobile = windowWidth <= 480;
  const boxSize = isMobile ? 45 : 50; 
  const gap = isMobile ? 8 : 12;
  const stepSize = boxSize + gap;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const isComplete = otp.every(digit => digit !== "");
    if (isComplete && status === "idle") {
      handleVerify();
    }
  }, [otp, status]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    const newOtp = [...otp];
    if (val) {
      newOtp[index] = val.slice(-1);
      setOtp(newOtp);
      if (index < 5) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1].focus();
      }
    } else {
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        setActiveIndex(index - 1);
        inputRefs.current[index - 1].focus();
      } else if (otp[index] !== "") {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    setActiveIndex(focusIndex);
    inputRefs.current[focusIndex].focus();
  };

  const handleVerify = () => {
    if (document.activeElement) document.activeElement.blur();
    
    // الانتظار قليلاً لرؤية الرقم الأخير ثم بدء الحركة
    setTimeout(() => {
      setStatus("merging"); 
      
      // توقيت متزامن مع حركة التجمع البطيئة (800ms)
      setTimeout(() => {
        setStatus("success");
        setActiveIndex(-1); 
      }, 850); 
    }, 250);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setOtp(Array(6).fill(""));
    setCountdown(30);
    setStatus("idle");
    setActiveIndex(0);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <div className="app-layout">
      <motion.div 
        className="container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div className={`icon-wrapper ${status === "success" ? "success" : ""}`} layout>
          <AnimatePresence mode="wait">
            {status !== "success" ? (
              <motion.div key="shield" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Shield size={28} strokeWidth={1.5} color="#6366f1" />
              </motion.div>
            ) : (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <Check size={28} strokeWidth={2} color="#10b981" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.h1 className="title" layout>Verify Your Code</motion.h1>
        <motion.p className="subtitle" layout>Enter the 6-digit verification code sent to you.</motion.p>

        <motion.div className="otp-animation-wrapper" layout>
          <AnimatePresence>
            {status !== "success" && (
              <motion.div 
                key="boxes"
                className="otp-container"
                exit={{ opacity: 0, transition: { duration: 0 } }} 
              >
                {otp.map((digit, index) => (
                  <OTPBox
                    key={index}
                    index={index}
                    value={digit}
                    isActive={activeIndex === index}
                    status={status}
                    stepSize={stepSize}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onFocus={(i) => setActiveIndex(i)}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </motion.div>
            )}
            
            {status === "success" && (
              <motion.div
                key="merged"
                className="merged-success-box"
                initial={{ width: `${boxSize}px`, borderRadius: "14px" }}
                animate={{ width: "100%", borderRadius: "28px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Elegant smooth stretch
              >
                <motion.div
                  className="success-content"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
                >
                  <Check size={22} strokeWidth={3} color="#ffffff" />
                  <span>Verified Successfully</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {status === "idle" && (
            <motion.button
              className="verify-btn"
              disabled={otp.some(d => d === "")}
              onClick={handleVerify}
              initial={{ opacity: 1, height: 52, marginTop: 40 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
              layout
            >
              Verify
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div className="resend-text" layout>
          <span>Didn't receive the code?</span>
          <button 
            className="resend-link" 
            onClick={handleResend}
            disabled={countdown > 0 || status !== "idle"}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}