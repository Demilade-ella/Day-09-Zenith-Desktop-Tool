import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Heatmap from './Heatmap';
import SessionSummary from './SessionSummary';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import '../styles/Zenith.css';

const saveToLocalJournal = (task, duration) => {
    if (window.require) {
        try {
            const fs = window.require('fs');
            const path = window.require('path');
            const os = window.require('os');
            
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString();
            
            const logEntry = `\n## ${dateString}\n- [${timeString}] ${task} (${duration}m)`;
            
            const filePath = path.join(os.homedir(), 'Desktop', 'Zenith_Flow_Log.md');
            
            fs.appendFile(filePath, logEntry, (err) => {
                if (err) console.error("Journal Sync Error:", err);
                else console.log("Personal Journal Updated on Desktop.");
            });
        } catch (e) {
            console.log("Not in Electron environment, skipping local save.");
        }
    }
};

function Zenith() {
    const [isActive, setIsActive] = useState(false);
    const [seconds, setSeconds] = useState(1500);
    const [totalFocusTime, setTotalFocusTime] = useState(0);

    const [activeSound, setActiveSound] = useState(null);
    const [audioPlayer] = useState(new Audio());

    const [focusHistory, setFocusHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('zeniith_history');
            return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
});

    const [currentTask, setCurrentTask] = useState("");

    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => prev - 1);
                setTotalFocusTime(prev => prev + 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            setShowSummary(true);
            playSuccess();
            clearInterval(interval);
            saveToLocalJournal(currentTask || "Deep Work", Math.floor(totalFocusTime / 60));
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, currentTask, totalFocusTime]);

    const playSuccess = () => {
        const audio = new Audio('sounds/success.mp3');
        audio.volume = 0.4;
        audio.play();
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progress = (seconds / 1500) * 100;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const toggleSound = (soundType) => {
        if (activeSound === soundType) {
            audioPlayer.pause();
            setActiveSound(null);
        } else {
            audioPlayer.src = `/sounds/${soundType}.mp3`;
            audioPlayer.loop = true;
            audioPlayer.play();
            setActiveSound(soundType);
        }
    };

    useEffect(() => {
        return () => audioPlayer.pause();
    }, [audioPlayer]);
    
    useEffect(() => {
        if (isActive) {
            const today = new Date().toISOString().split('T')[0];
            const updatedHistory = {
                ...focusHistory,
                [today]: (focusHistory[today] || 0) + (1/60)
            };
            setFocusHistory(updatedHistory);
            localStorage.setItem('zenith_history', JSON.stringify(updatedHistory));
        }
    }, [totalFocusTime, focusHistory, isActive]);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => prev - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            setShowSummary(true);
            playSuccess();
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

  return (
    <div className='zenith-container'>
      <div className='zenith-header'>
        <span className='zenith-logo'> ZENITH </span>
        {navigator.userAgent.toLowerCase().includes('electron') && (
            <div className='window-controls'>
                <button
                    className='control-btn minimize-btn'
                    onClick={() => {
                        if (window && window.require) {
                            window.require('electron').ipcRenderer.send('minimize-me');
                        }
                    }}
                >
                    <MinimizeIcon />
                </button>

                <button
                    className='control-btn close-btn'
                    onClick={() => {
                        if (window && window.require) {
                            window.require('electron').ipcRenderer.send('close-me');
                        }
                    }}
                >
                    <CloseIcon />
                </button>
            </div>
        )}
        <div className='session-count'> Daily Pulse: {Math.floor(totalFocusTime / 60)}m </div>
      </div>

      <div className='focus-vault'>
        <div className='aura-wrapper'>
            <svg width="200" height="200" className='aura-svg'>
                <circle
                    cx="100" cy="100" r={radius}
                    className='aura-bg'
                />
                <motion.circle
                    cx="100" cy="100" r={radius}
                    className='aura-progress'
                    strokeDasharray={circumference}
                    animate={{
                        strokeDashoffset: offset,
                        filter: isActive ? [
                            "drop-shadow(0 0 8px #d4af37)",
                            "drop-shadow(0 0 20px #d4af37)",
                            "drop-shadow(0 0 8px #d4af37)"
                        ] : "drop-shadow(0 0 2px #d4af37)"
                    }}
                    transition={{
                        filter: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                        strokeDashoffset: { duration: 1 }
                    }}
                />
            </svg>

            <div className='timer-display'>
                <motion.h1
                    key={seconds}
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {formatTime(seconds)}
                </motion.h1>
                <p> {isActive ? "DEEP WORK" : "READY?"} </p>
            </div>
        </div>

        <input 
                type="text" 
                placeholder="What is your focus goal?"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                className="task-input"
                disabled={isActive}
            />

        <div className='controls'>
            <button
                className={`action-btn ${isActive ? 'pause' : 'start'}`}
                onClick={() => setIsActive(!isActive)}
            >
                {isActive ? "PAUSE FLOW" : "ENTER FLOW"}
            </button>
            <button
                className='reset-btn'
                onClick={() => {setIsActive(false); setSeconds(1500)}}
            >
                RESET
            </button>
        </div>
      </div>

      <div className='soundscape-vault'>
        <p className='section-label'> AMBIENCE </p>
        <div className='sound-buttons'>
            <motion.button
                whileTap={{ scale: 0.9 }}
                className={`sound-btn ${activeSound === 'rain' ? 'active' : ''}`}
                onClick={() => toggleSound('rain')}
            >
                🌧️ {activeSound === 'rain' && <div className='audio-wave' />}
                <span> RAIN </span>
            </motion.button>

            <motion.div
                whileTap={{ scale: 0.9 }}
                className={`sound-btn ${activeSound === 'lofi' ? 'active' : ''}`}
                onClick={() => toggleSound('lofi')}
            >
                🎧 {activeSound === 'lofi' && <div className='audio-wave' />}
                <span> LO-FI </span>
            </motion.div>
        </div>
      </div>

      <Heatmap focusHistory={focusHistory} />

      <SessionSummary
        isOpen={showSummary}
        onClose={() => {
            setShowSummary(false);
            setCurrentTask("");
        }}
        minutesDone={totalFocusTime}
        taskName={currentTask || "Deep Work"}
      />
    </div>
  )
}

export default Zenith;
