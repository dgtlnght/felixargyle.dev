<script lang="ts">
    let startTime: number;
    let running: boolean = false;
    let time: number = 0;
    let displayTime: string = "0.00";
    let times: { time: number; dnf: boolean; plus2: boolean }[] = [];
    let inspectionTime: number = 0;
    let inspectionRunning: boolean = false;
    let inspectionStart: number;
    let inspectionDisplay: string = "0.00";
    let timerHidden: boolean = false;
    let lastRecordedTime: string = "";
    
    // Settings menu
    let showSettings: boolean = false;
    
    // Stackmat related variables
    let stackmatConnected: boolean = false;
    let stackmatDevice: MediaStreamAudioSourceNode | null = null;
    let audioContext: AudioContext | null = null;
    let stackmatProcessor: ScriptProcessorNode | null = null;
    let stackmatLastState: number = 0; // 0 = reset, 1 = ready, 2 = running
    let stackmatBuffer: number[] = [];
    let stackmatReadyTime: number = 0;
    
    // Theme variables
    let bgColor: string = "#000000";
    let textColor: string = "#FFEB3B"; // Yellow
    let accentColor: string = "#FFEB3B"; // Yellow
    let showColorPicker: boolean = false;
    
    // Predefined themes as hex colors
    const presetThemes = [
        { name: "Yellow", bg: "#000000", text: "#FFEB3B", accent: "#FFEB3B" },
        { name: "Blue", bg: "#111827", text: "#60A5FA", accent: "#60A5FA" },
        { name: "Green", bg: "#111827", text: "#4ADE80", accent: "#4ADE80" },
        { name: "Red", bg: "#111827", text: "#F87171", accent: "#F87171" },
        { name: "Purple", bg: "#111827", text: "#A78BFA", accent: "#A78BFA" }
    ];
    
    // Initialize stackmat timer
    async function initStackmat() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Media devices not supported");
                return;
            }
            
            // Get audio input devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            if (audioInputs.length === 0) {
                console.error("No audio input devices found");
                return;
            }
            
            // Create audio context
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Get user media for audio
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            // Create audio source from stream
            stackmatDevice = audioContext.createMediaStreamSource(stream);
            
            // Create script processor for audio processing
            stackmatProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            // Connect the processor
            stackmatDevice.connect(stackmatProcessor);
            stackmatProcessor.connect(audioContext.destination);
            
            // Process audio data
            stackmatProcessor.onaudioprocess = processStackmatAudio;
            
            stackmatConnected = true;
            console.log("Stackmat connected!");
        } catch (error) {
            console.error("Error initializing stackmat:", error);
        }
    }
    
    // Process audio data from stackmat
    function processStackmatAudio(e: AudioProcessingEvent) {
        if (!audioContext) return;
        
        const data = e.inputBuffer.getChannelData(0);
        const sampleRate = audioContext.sampleRate;
        
        // Process the audio data to detect stackmat signals
        for (let i = 0; i < data.length; i++) {
            stackmatBuffer.push(Math.abs(data[i]));
            if (stackmatBuffer.length > sampleRate * 0.05) { // 50ms buffer
                stackmatBuffer.shift();
            }
        }
        
        // Simple threshold detection for state changes
        const signalStrength = stackmatBuffer.reduce((a, b) => a + b, 0) / stackmatBuffer.length;
        
        // Detect state changes based on signal strength
        if (signalStrength > 0.1) { // Adjust threshold as needed
            // Detect ready state (green light on stackmat)
            if (stackmatLastState === 0) {
                stackmatLastState = 1; // Ready state
                stackmatReadyTime = performance.now();
            }
            // Detect running state (timer started)
            else if (stackmatLastState === 1 && performance.now() - stackmatReadyTime > 500) {
                if (!running) {
                    if (inspectionRunning) {
                        inspectionRunning = false;
                    }
                    startTime = performance.now();
                    running = true;
                    updateTimer();
                    stackmatLastState = 2; // Running state
                }
            }
        } else {
            // Detect when hands are removed during running state
            if (stackmatLastState === 2 && running) {
                stopTimer();
                stackmatLastState = 0; // Reset state
            }
            // Reset to initial state when no signal
            else if (stackmatLastState !== 0) {
                stackmatLastState = 0;
            }
        }
    }
    
    // Disconnect stackmat
    function disconnectStackmat() {
        if (stackmatProcessor && stackmatDevice) {
            stackmatProcessor.disconnect();
            stackmatDevice.disconnect();
            stackmatProcessor = null;
            stackmatDevice = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        stackmatConnected = false;
        console.log("Stackmat disconnected");
    }
    
    function startTimer(): void {
      if (!running && !inspectionRunning) {
        startTime = performance.now();
        running = true;
        updateTimer();
      }
    }
  
    function stopTimer(): void {
    if (running) {
        running = false;
        // Store the current display time before resetting internal time value
        lastRecordedTime = displayTime;
        times = [...times, { time, dnf: false, plus2: false }];
        
        // Don't reset the display time immediately if timer is hidden
        if (!timerHidden) {
        time = 0;
        displayTime = "0.00";
        }
        // If timer is hidden, keep the last time showing (handled by the display logic)
    }
    }
  
    function updateTimer(): void {
      if (running) {
        const now = performance.now();
        time = now - startTime;
        displayTime = (time / 1000).toFixed(2);
        requestAnimationFrame(updateTimer);
      }
    }
  
    function resetTimer(): void {
    if (inspectionRunning) {
        inspectionRunning = false;
        inspectionTime = 0;
        inspectionDisplay = "0.00";
    } else if (running) {
        stopTimer();
    }
    // Reset display values but keep lastRecordedTime if timer is hidden
    if (!timerHidden) {
        time = 0;
        displayTime = "0.00";
    }
    }
  
    function startInspection(): void {
      if (!inspectionRunning && !running) {
        inspectionStart = performance.now();
        inspectionRunning = true;
        updateInspection();
      }
    }
  
    function updateInspection(): void {
      if (inspectionRunning) {
        const now = performance.now();
        inspectionTime = now - inspectionStart;
        inspectionDisplay = (inspectionTime / 1000).toFixed(2);
        requestAnimationFrame(updateInspection);
      }
    }
  
    function formatTime(timeObj: { time: number; dnf: boolean; plus2: boolean }): string {
      if (timeObj.dnf) {
        return "DNF";
      }
      let formatted = (timeObj.time / 1000).toFixed(2);
      if (timeObj.plus2) {
        formatted = (parseFloat(formatted) + 2).toFixed(2);
      }
      return formatted;
    }
  
    function calculateAverage(arr: { time: number; dnf: boolean; plus2: boolean }[]): string {
      if (arr.length === 0) return "N/A";
      const validTimes = arr.filter(t => !t.dnf);
      if (validTimes.length === 0) return "N/A";
      const sum = validTimes.reduce((a, b) => a + (b.plus2 ? b.time + 2000 : b.time), 0);
      return (sum / validTimes.length / 1000).toFixed(2);
    }
  
    function calculateAverageOfFive(arr: { time: number; dnf: boolean; plus2: boolean }[]): string {
      if (arr.length < 5) return "N/A";
      const sorted = arr.slice(-5).sort((a, b) => (a.dnf ? Infinity : a.time) - (b.dnf ? Infinity : b.time));
      const validTimes = sorted.filter(t => !t.dnf).slice(1, 4);
      if (validTimes.length < 3) return "N/A";
      const sum = validTimes.reduce((a, b) => a + (b.plus2 ? b.time + 2000 : b.time), 0);
      return (sum / validTimes.length / 1000).toFixed(2);
    }
  
    function calculateAverageOfTwelve(arr: { time: number; dnf: boolean; plus2: boolean }[]): string {
      if (arr.length < 12) return "N/A";
      const sorted = arr.slice(-12).sort((a, b) => (a.dnf ? Infinity : a.time) - (b.dnf ? Infinity : b.time));
      const validTimes = sorted.filter(t => !t.dnf).slice(1, 11);
      if (validTimes.length < 10) return "N/A";
      const sum = validTimes.reduce((a, b) => a + (b.plus2 ? b.time + 2000 : b.time), 0);
      return (sum / validTimes.length / 1000).toFixed(2);
    }
    
    function getBestTime(arr: { time: number; dnf: boolean; plus2: boolean }[]): string {
      if (arr.length === 0) return "N/A";
      const validTimes = arr.filter(t => !t.dnf);
      if (validTimes.length === 0) return "N/A";
      
      // Find the best time, accounting for +2 penalties
      const bestTime = Math.min(...validTimes.map(t => t.plus2 ? t.time + 2000 : t.time));
      return (bestTime / 1000).toFixed(2);
    }
  
    function deleteTime(index: number): void {
      times.splice(index, 1);
      times = [...times];
    }
  
    function clearTimes(): void {
      times = [];
    }
  
    function handleSpacebar(event: KeyboardEvent): void {
    if (event.code === "Space") {
        event.preventDefault();
        if (running) {
        stopTimer();
        } else if (inspectionRunning) {
        inspectionRunning = false;
        startTimer();
        } else {
        // Reset display time when starting a new solve/inspection
        if (timerHidden) {
            // Only need to reset internal values since display shows SOLVE during running
            time = 0;
            displayTime = "0.00";
        }
        startInspection();
        }
    } else if (event.code === "Escape") {
        resetTimer();
    } else if (event.code === "KeyC" && event.ctrlKey) {
        clearTimes();
    } else if (event.code === "KeyH" && event.ctrlKey) {
        toggleTimerVisibility();
    }
    }

    function toggleDNF(index: number): void {
      times[index].dnf = !times[index].dnf;
      times = [...times];
    }
  
    function togglePlus2(index: number): void {
      times[index].plus2 = !times[index].plus2;
      times = [...times];
    }
    
    function toggleColorPicker(): void {
      showColorPicker = !showColorPicker;
    }
    
    function toggleSettings(): void {
      showSettings = !showSettings;
    }
    
    function toggleTimerVisibility(): void {
      timerHidden = !timerHidden;
    }
    
    function applyTheme(theme: { bg: string, text: string, accent: string }): void {
      bgColor = theme.bg;
      textColor = theme.text;
      accentColor = theme.accent;
      showColorPicker = false;
    }
    
    // Calculate contrast for text color against background
    function getContrastColor(hexColor: string): string {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      // Calculate luminance using perceived brightness formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return black or white based on luminance
      return luminance > 0.5 ? "#000000" : "#FFFFFF";
    }
    
    // Get button text color based on button background
    function getButtonTextColor(bgHex: string): string {
      return getContrastColor(bgHex);
    }
  
    $: avg = calculateAverage(times);
    $: avg5 = calculateAverageOfFive(times);
    $: avg12 = calculateAverageOfTwelve(times);
    $: bestTime = getBestTime(times);
    $: buttonTextColor = getButtonTextColor(accentColor);
</script>
  
<svelte:window on:keydown={handleSpacebar} />
  
<div style="background-color: {bgColor}; color: {textColor};" class="min-h-screen flex flex-col items-center justify-center p-4 relative">
    <!-- Top navbar -->
    <div class="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
        <!-- Theme selector -->
        <button 
          style="background-color: {accentColor}; color: {buttonTextColor};"
          class="px-4 py-2 rounded font-bold flex items-center"
          on:click={toggleColorPicker}
        >
          <span class="mr-2">Theme</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
        </button>

        <div class="flex space-x-4">
          <!-- GitHub link -->
          <a 
            href="https://github.com/dgtlnght/felixargyle.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            style="background-color: {accentColor}; color: {buttonTextColor};"
            class="px-4 py-2 rounded font-bold flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </a>

          <!-- Toggle timer visibility -->
          <button 
            style="background-color: {accentColor}; color: {buttonTextColor};"
            class="px-4 py-2 rounded font-bold"
            on:click={toggleTimerVisibility}
          >
            {timerHidden ? 'Show Timer' : 'Hide Timer'}
          </button>

          <!-- Settings button -->
          <button 
            style="background-color: {accentColor}; color: {buttonTextColor};"
            class="px-4 py-2 rounded font-bold flex items-center"
            on:click={toggleSettings}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </div>
    </div>
    
    {#if showColorPicker}
    <div class="absolute top-16 left-4 p-4 rounded shadow-lg w-64 z-20" style="background-color: {bgColor}; border: 2px solid {accentColor};">
      <div class="mb-4">
        <h3 class="font-bold mb-2" style="color: {textColor};">Preset Themes</h3>
        <div class="grid grid-cols-5 gap-2">
          {#each presetThemes as theme}
            <button 
              class="w-8 h-8 rounded-full border"
              style="background-color: {theme.accent}; border-color: {textColor};"
              on:click={() => applyTheme(theme)}
              title={theme.name}
            ></button>
          {/each}
        </div>
      </div>
      
      <div class="mb-3">
        <h3 class="font-bold mb-1" style="color: {textColor};">Background</h3>
        <div class="flex items-center">
          <input type="color" bind:value={bgColor} class="w-8 h-8 mr-2" />
          <input 
            type="text" 
            bind:value={bgColor} 
            class="flex-1 px-2 py-1 border rounded" 
            style="border-color: {accentColor}; background-color: {bgColor}; color: {textColor};"
          />
        </div>
      </div>
      
      <div class="mb-3">
        <h3 class="font-bold mb-1" style="color: {textColor};">Text</h3>
        <div class="flex items-center">
          <input type="color" bind:value={textColor} class="w-8 h-8 mr-2" />
          <input 
            type="text" 
            bind:value={textColor} 
            class="flex-1 px-2 py-1 border rounded"
            style="border-color: {accentColor}; background-color: {bgColor}; color: {textColor};"
          />
        </div>
      </div>
      
      <div class="mb-3">
        <h3 class="font-bold mb-1" style="color: {textColor};">Accent</h3>
        <div class="flex items-center">
          <input type="color" bind:value={accentColor} class="w-8 h-8 mr-2" />
          <input 
            type="text" 
            bind:value={accentColor} 
            class="flex-1 px-2 py-1 border rounded"
            style="border-color: {accentColor}; background-color: {bgColor}; color: {textColor};"
          />
        </div>
      </div>
      
      <button 
        style="background-color: {accentColor}; color: {buttonTextColor};"
        class="w-full py-2 rounded font-bold"
        on:click={() => showColorPicker = false}
      >
        Apply
      </button>
    </div>
  {/if}
  
  {#if showSettings}
    <div class="absolute top-16 right-4 p-4 rounded shadow-lg w-72 z-20" style="background-color: {bgColor}; border: 2px solid {accentColor};">
      <h3 class="font-bold mb-4 text-lg" style="color: {textColor};">Settings</h3>
      
      <div class="mb-4">
        <h4 class="font-semibold mb-2" style="color: {textColor};">Stackmat Timer</h4>
        {#if !stackmatConnected}
          <button 
            style="background-color: {accentColor}; color: {buttonTextColor};" 
            class="w-full py-2 rounded font-bold mb-2"
            on:click={initStackmat}
          >
            Connect Stackmat
          </button>
        {:else}
          <button 
            style="background-color: {accentColor}; color: {buttonTextColor};" 
            class="w-full py-2 rounded font-bold mb-2"
            on:click={disconnectStackmat}
          >
            Disconnect Stackmat
          </button>
          <p class="text-sm mb-2" style="color: {textColor};">Status: Connected</p>
        {/if}
      </div>
      
      <div class="mb-4">
        <h4 class="font-semibold mb-2" style="color: {textColor};">Timer Settings</h4>
        <div class="flex items-center justify-between mb-2">
          <span style="color: {textColor};">Hide Timer</span>
          <button 
            style="background-color: {accentColor}; color: {buttonTextColor};" 
            class="px-3 py-1 rounded"
            on:click={toggleTimerVisibility}
          >
            {timerHidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="font-semibold mb-2" style="color: {textColor};">Data Management</h4>
        <button 
          class="w-full py-2 rounded font-bold mb-2" 
          style="background-color: #F87171; color: white;"
          on:click={clearTimes}
        >
          Clear All Times
        </button>
      </div>
      
      <div class="mb-4">
        <h4 class="font-semibold mb-2" style="color: {textColor};">Keyboard Shortcuts</h4>
        <div class="text-sm" style="color: {textColor};">
          <p><strong>Space:</strong> Start/Stop Timer</p>
          <p><strong>Escape:</strong> Reset Timer</p>
          <p><strong>Ctrl+C:</strong> Clear All Times</p>
          <p><strong>Ctrl+H:</strong> Toggle Timer Visibility</p>
        </div>
      </div>
      
      <button 
        style="background-color: {accentColor}; color: {buttonTextColor};"
        class="w-full py-2 rounded font-bold"
        on:click={() => showSettings = false}
      >
        Close Settings
      </button>
    </div>
  {/if}
    
    <!-- Combined timer display -->
    <div class="flex flex-col items-center mt-16">
        {#if inspectionRunning}
          <div class="text-8xl font-bold mb-6" style="color: {textColor};">Inspection: {inspectionDisplay}</div>
        {:else if running}
          <div class="text-8xl font-bold mb-6" style="color: {textColor};">{displayTime}</div>
        {:else if timerHidden && times.length > 0}
          <div class="text-8xl font-bold mb-6" style="color: {textColor};">{lastRecordedTime}</div>
        {:else if timerHidden}
          <div class="text-8xl font-bold mb-6" style="color: {textColor};">SOLVE</div>
        {:else}
          <div class="text-8xl font-bold mb-6" style="color: {textColor};">{displayTime}</div>
        {/if}
      </div>
    
    <!-- Stats information that replaces buttons -->
    <div class="grid grid-cols-2 gap-8 mb-6 w-full max-w-lg">
      <div style="border-color: {accentColor};" class="bg-transparent border px-6 py-4 rounded text-center">
        <div style="color: {textColor};" class="text-lg">Best Time</div>
        <div style="color: {textColor};" class="text-3xl font-bold">{bestTime}</div>
      </div>
      <div style="border-color: {accentColor};" class="bg-transparent border px-6 py-4 rounded text-center">
        <div style="color: {textColor};" class="text-lg">Average</div>
        <div style="color: {textColor};" class="text-3xl font-bold">{avg}</div>
      </div>
    </div>
    
    <div class="mb-6 text-xl grid grid-cols-2 gap-4">
      <div class="text-center">
        <p style="color: {textColor};">Average of 5</p>
        <p style="color: {textColor};" class="text-2xl font-bold">{avg5}</p>
      </div>
      <div class="text-center">
        <p style="color: {textColor};">Average of 12</p>
        <p style="color: {textColor};" class="text-2xl font-bold">{avg12}</p>
      </div>
    </div>
    
    <div class="overflow-y-auto max-h-64 w-full max-w-2xl">
      <table class="w-full">
        <thead>
          <tr>
            <th style="color: {textColor};" class="text-left">#</th>
            <th style="color: {textColor};" class="text-left">Time</th>
            <th style="color: {textColor};" class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each times as timeObj, index}
            <tr>
              <td style="color: {textColor};" class="py-2 pr-4">{times.length - index}</td>
              <td style="color: {textColor};" class="py-2">{formatTime(timeObj)}</td>
              <td class="py-2 flex justify-end space-x-2">
                <button style="background-color: {accentColor}; color: {buttonTextColor};" class="px-3 py-1 rounded" on:click={() => togglePlus2(index)}>+2</button>
                <button style="background-color: {accentColor}; color: {buttonTextColor};" class="px-3 py-1 rounded" on:click={() => toggleDNF(index)}>DNF</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded" on:click={() => deleteTime(index)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Footer with version and credits -->
    <div class="absolute bottom-2 left-0 right-0 text-center opacity-70 text-sm" style="color: {textColor};">
      v1.1.0 | Made with 💖 | <a href="https://github.com/dgtlnght/felixargyle.dev" target="_blank" rel="noopener noreferrer" class="underline">GitHub</a>
    </div>
</div>