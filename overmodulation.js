document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("modIndexSlider");
    if (!slider) return;

    const mDisplay = document.getElementById("mValueDisplay");
    const statusBadge = document.getElementById("statusBadge");
    const fundVal = document.getElementById("fundVal");
    const thdVal = document.getElementById("thdVal");
    const rippleVal = document.getElementById("rippleVal");
    
    const canvasCarrier = document.getElementById("canvasCarrier");
    const ctxC = canvasCarrier.getContext("2d");
    const canvasOutput = document.getElementById("canvasOutput");
    const ctxO = canvasOutput.getContext("2d");
    const canvasMotor = document.getElementById("canvasMotor");
    const ctxM = canvasMotor ? canvasMotor.getContext("2d") : null;
    
    let time = 0;
    
    function resizeCanvas() {
        const panels = document.querySelectorAll('.animation-panel');
        if (panels.length >= 2) {
            canvasCarrier.width = canvasCarrier.parentElement.clientWidth - 48;
            canvasCarrier.height = 260;
            canvasOutput.width = canvasOutput.parentElement.clientWidth - 48;
            canvasOutput.height = 260;
            if (canvasMotor) {
                const motorWidth = Math.min(canvasMotor.parentElement.clientWidth - 48, 420);
                canvasMotor.width = motorWidth;
                canvasMotor.height = 260;
                canvasMotor.style.maxWidth = '420px';
            }
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    function updateMetrics(M) {
        mDisplay.textContent = M.toFixed(2);
        
        let status = "";
        let color = "";
        let fVal = 0;
        let thd = "";
        let ripple = "";
        
        if (M <= 1.0) {
            status = "Linear SPWM";
            color = "#4caf50";
            fVal = M * 78.5; 
            thd = "< 5%";
            ripple = "Minimal";
        } else if (M <= 1.15) {
            status = "Linear SVPWM (Zero-Seq Injected)";
            color = "#8bc34a";
            fVal = 78.5 + (M - 1.0) * (90.7 - 78.5) / 0.15; // interpolation
            thd = "5% - 8%";
            ripple = "Low";
        } else if (M < 1.27) {
            status = "Overmodulation (Pulse Dropping)";
            color = "#ff9800";
            fVal = 90.7 + (M - 1.15) * (98.0 - 90.7) / 0.12;
            thd = "15% - 35%";
            ripple = "High (Degradation)";
        } else {
            status = "Six-Step Mode";
            color = "#f44336";
            fVal = 100.0;
            thd = "> 80%";
            ripple = "Severe (Max Ripple)";
        }
        
        statusBadge.textContent = status;
        statusBadge.style.borderColor = color;
        statusBadge.style.color = color;
        
        fundVal.textContent = Math.min(100, fVal).toFixed(1) + "%";
        fundVal.style.color = color;
        thdVal.textContent = thd;
        rippleVal.textContent = ripple;
        
        rippleVal.style.color = "#fff";
        if (M > 1.15) {
            rippleVal.style.color = "#ff9800";
        }
        if (M >= 1.27) {
            rippleVal.style.color = "#f44336";
        }
    }
    
    function drawWaveforms() {
        const M = parseFloat(slider.value);
        updateMetrics(M);
        
        const wC = canvasCarrier.width;
        const hC = canvasCarrier.height;
        const wO = canvasOutput.width;
        const hO = canvasOutput.height;
        
        ctxC.clearRect(0, 0, wC, hC);
        ctxO.clearRect(0, 0, wO, hO);
        if (ctxM) ctxM.clearRect(0, 0, wC, hC);
        
        // Draw Grid
        ctxC.strokeStyle = "#222";
        ctxC.lineWidth = 1;
        ctxC.beginPath();
        ctxC.moveTo(0, hC/2); ctxC.lineTo(wC, hC/2);
        ctxC.stroke();
        
        ctxO.strokeStyle = "#222";
        ctxO.beginPath();
        ctxO.moveTo(0, hO/2); ctxO.lineTo(wO, hO/2);
        ctxO.stroke();
        
        const carrierFreq = 25; 
        const fundFreq = 1.5; 
        const numPoints = Math.floor(wC);
        
        const carrierWave = new Float32Array(numPoints);
        const refWave = new Float32Array(numPoints);
        const pwmWave = new Float32Array(numPoints);
        
        const phaseShift = -time * 0.05; 
        
        for (let x = 0; x < numPoints; x++) {
            const t = x / wC;
            
            // Triangle carrier
            const cPhase = (t * carrierFreq) % 1;
            carrierWave[x] = cPhase < 0.5 ? (cPhase * 4 - 1) : (3 - cPhase * 4);
            
            // Sine reference
            let fund = M * Math.sin(2 * Math.PI * fundFreq * t + phaseShift);
            
            // If SVPWM simulation (M > 1.0 but <= 1.15), inject 3rd harmonic to flatten peak
            if (M > 1.0 && M <= 1.15) {
                // Approximate zero-sequence injection
                let thirdHarmonic = -(M/6) * Math.sin(3 * 2 * Math.PI * fundFreq * t + 3 * phaseShift);
                fund += thirdHarmonic;
            }
            
            refWave[x] = fund;
            
            // PWM generation
            pwmWave[x] = refWave[x] > carrierWave[x] ? 1 : -1;
            
            // Six-step logic overrides
            if (M >= 1.27) {
                 const angle = (2 * Math.PI * fundFreq * t + phaseShift) % (2*Math.PI);
                 let angNormal = angle < 0 ? angle + 2*Math.PI : angle;
                 if (angNormal < Math.PI) pwmWave[x] = 1;
                 else pwmWave[x] = -1;
            } else if (M > 1.15) {
                // In overmodulation, physical clipping occurs in the modulator
                if (refWave[x] > 1) refWave[x] = 1;
                if (refWave[x] < -1) refWave[x] = -1;
            }
        }
        
        // Draw Carrier
        ctxC.strokeStyle = "#444";
        ctxC.lineWidth = 1;
        ctxC.beginPath();
        for (let x = 0; x < numPoints; x++) {
            const y = hC/2 - carrierWave[x] * (hC/2.5);
            if (x===0) ctxC.moveTo(x, y);
            else ctxC.lineTo(x, y);
        }
        ctxC.stroke();
        
        // Draw Reference
        ctxC.strokeStyle = (M > 1.0 && M <= 1.15) ? "#8bc34a" : "#4fc3f7"; // change color to show SVPWM injection
        ctxC.lineWidth = 3;
        ctxC.shadowBlur = 8;
        ctxC.shadowColor = ctxC.strokeStyle;
        ctxC.beginPath();
        for (let x = 0; x < numPoints; x++) {
            const y = hC/2 - refWave[x] * (hC/2.5);
            if (x===0) ctxC.moveTo(x, y);
            else ctxC.lineTo(x, y);
        }
        ctxC.stroke();
        ctxC.shadowBlur = 0;
        
        // Clipping Lines
        ctxC.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctxC.setLineDash([4, 4]);
        ctxC.beginPath();
        ctxC.moveTo(0, hC/2 - 1 * (hC/2.5)); ctxC.lineTo(wC, hC/2 - 1 * (hC/2.5));
        ctxC.moveTo(0, hC/2 - (-1) * (hC/2.5)); ctxC.lineTo(wC, hC/2 - (-1) * (hC/2.5));
        ctxC.stroke();
        ctxC.setLineDash([]);
        
        // Draw PWM
        ctxO.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctxO.lineWidth = 1.5;
        ctxO.beginPath();
        for (let x = 0; x < numPoints; x++) {
            const y = hO/2 - pwmWave[x] * (hO/2.5);
            if (x===0) ctxO.moveTo(x, y);
            else ctxO.lineTo(x, y);
        }
        ctxO.stroke();
        
        // Draw Current (filtered + distortion)
        ctxO.strokeStyle = "#4caf50";
        if (M > 1.15) ctxO.strokeStyle = "#ff9800";
        if (M >= 1.27) ctxO.strokeStyle = "#f44336";
        
        ctxO.lineWidth = 3;
        ctxO.shadowBlur = 8;
        ctxO.shadowColor = ctxO.strokeStyle;
        ctxO.beginPath();
        
        let filtered = 0;
        let alpha = 0.08; 
        if(M >= 1.27) alpha = 0.15; 
        
        for(let x = numPoints - 100; x < numPoints; x++) {
            filtered = filtered * (1 - alpha) + pwmWave[x] * alpha;
        }
        
        for (let x = 0; x < numPoints; x++) {
            filtered = filtered * (1 - alpha) + pwmWave[x] * alpha;
            
            let distortion = 0;
            if (M > 1.15 && M < 1.27) {
                // Overmodulation pulse dropping creates low order harmonics
                distortion = Math.sin(2 * Math.PI * fundFreq * 5 * (x/wC) + phaseShift * 5) * (M - 1.15) * 0.4;
            } else if (M >= 1.27) {
                // 6-step severe 5th and 7th harmonics
                distortion = Math.sin(2 * Math.PI * fundFreq * 5 * (x/wC) + phaseShift * 5) * 0.15 + 
                             Math.sin(2 * Math.PI * fundFreq * 7 * (x/wC) + phaseShift * 7) * 0.1;
                distortion += (Math.random() - 0.5) * 0.1; // Add some noise
            }
            
            let currentAmp = filtered * 1.5 + distortion;
            const y = hO/2 - currentAmp * (hO/2.5);
            
            if (x===0) ctxO.moveTo(x, y);
            else ctxO.lineTo(x, y);
        }
        ctxO.stroke();
        ctxO.shadowBlur = 0;
        
        // Draw Warning Overlay if Six-Step
        if (M >= 1.27) {
            ctxO.fillStyle = "rgba(244, 67, 54, 0.1)";
            ctxO.fillRect(0, 0, wO, hO);
            ctxO.fillStyle = "#f44336";
            ctxO.font = "bold 14px Arial";
            ctxO.textAlign = "right";
            ctxO.fillText("SEVERE TORQUE RIPPLE", wO - 10, 20);
        } else if (M > 1.15) {
            ctxO.fillStyle = "#ff9800";
            ctxO.font = "bold 14px Arial";
            ctxO.textAlign = "right";
            ctxO.fillText("HARMONICS INCREASING", wO - 10, 20);
        }

        // Draw Motor
        if (ctxM) {
            const wM = canvasMotor.width;
            const hM = canvasMotor.height;
            const cx = wM / 2;
            const cy = hM / 2;
            const radius = Math.min(wM, hM) / 3.2; // smaller to fit nicely
            
            // Calculate vibration if in overmodulation
            let vibX = 0, vibY = 0;
            if (M > 1.15 && M < 1.27) {
                vibX = (Math.random() - 0.5) * (M - 1.15) * 15;
                vibY = (Math.random() - 0.5) * (M - 1.15) * 15;
            } else if (M >= 1.27) {
                vibX = (Math.random() - 0.5) * 12;
                vibY = (Math.random() - 0.5) * 12;
            }
            
            ctxM.save();
            ctxM.translate(cx + vibX, cy + vibY);
            
            // Stator
            ctxM.beginPath();
            ctxM.arc(0, 0, radius, 0, Math.PI * 2);
            ctxM.strokeStyle = "#444";
            ctxM.lineWidth = 4;
            ctxM.stroke();
            
            // Speed of rotation increases with M
            const rotSpeed = 0.05 * M;
            // Rotor angle
            const angle = time * rotSpeed;
            ctxM.rotate(angle);
            
            // Rotor body
            ctxM.beginPath();
            ctxM.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
            ctxM.fillStyle = "#222";
            ctxM.fill();
            ctxM.lineWidth = 2;
            ctxM.stroke();
            
            // Magnets (4 pole)
            for(let i=0; i<4; i++) {
                ctxM.save();
                ctxM.rotate(i * Math.PI/2);
                ctxM.beginPath();
                ctxM.arc(0, 0, radius * 0.8, -Math.PI/8, Math.PI/8);
                ctxM.lineTo(0,0);
                ctxM.fillStyle = (i%2===0) ? "#ef4444" : "#3b82f6"; // N/S poles
                ctxM.fill();
                ctxM.restore();
            }
            
            // Center shaft
            ctxM.beginPath();
            ctxM.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
            ctxM.fillStyle = "#888";
            ctxM.fill();
            
            ctxM.restore();
            
            // Text for motor state
            ctxM.fillStyle = "#aaa";
            ctxM.font = "12px Arial";
            ctxM.textAlign = "center";
            if (M >= 1.27) {
                ctxM.fillStyle = "#f44336";
                ctxM.fillText("SEVERE VIBRATION", cx, hC - 10);
            } else if (M > 1.15) {
                ctxM.fillStyle = "#ff9800";
                ctxM.fillText("MODERATE VIBRATION", cx, hC - 10);
            } else {
                ctxM.fillStyle = "#4caf50";
                ctxM.fillText("SMOOTH RUNNING", cx, hC - 10);
            }
        }
        
        time += 1;
        requestAnimationFrame(drawWaveforms);
    }
    
    drawWaveforms();
});
