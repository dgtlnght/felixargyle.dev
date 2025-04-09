<script>
    import { onMount } from 'svelte';
    
    let terminalEl;
    let inputEl;
    let terminalOutput = [];
    let currentInput = '';
    let cursorPosition = 0;
    let currentDir = 'C:\\>';
    let showCursor = true;
    
    // DOS-style file system simulation
    const fileSystem = {
      'AUTOEXEC.BAT': 'System configuration file',
      'CONFIG.SYS': 'System configuration file',
      'COMMAND.COM': 'Command interpreter',
      'README.TXT': 'DOS system readme file',
      'GAMES': 'Directory',
      'UTILS': 'Directory',
    };
    
    // DOS commands
    const commands = {
      'HELP': () => {
        return [
          'Available commands:',
          'DIR      - Lists files in current directory',
          'CLS      - Clears the screen',
          'VER      - Shows system version',
          'DATE     - Shows current date',
          'TIME     - Shows current time',
          'ECHO     - Displays messages',
          'TYPE     - Displays file contents',
          'HELP     - Shows this help screen'
        ];
      },
      'CLS': () => {
        setTimeout(() => {
          terminalOutput = [];
        }, 100);
        return [];
      },
      'DIR': () => {
        let output = [
          ' Volume in drive C is DOS_DISK',
          ' Directory of C:\\',
          '',
          '.'
        ];
        
        Object.keys(fileSystem).forEach(file => {
          const isDirectory = fileSystem[file] === 'Directory';
          const date = '04-09-25  08:14AM';
          if (isDirectory) {
            output.push(`${date}    <DIR>          ${file}`);
          } else {
            output.push(`${date}         1,024 ${file}`);
          }
        });
        
        output.push('        8 File(s)     12,288 bytes');
        output.push('        2 Dir(s)  33,554,432 bytes free');
        
        return output;
      },
      'VER': () => {
        return ['MS-DOS Version 6.22'];
      },
      'DATE': () => {
        const date = new Date();
        return [`Current date is ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`];
      },
      'TIME': () => {
        const date = new Date();
        return [`Current time is ${date.toLocaleTimeString('en-US')}`];
      },
      'ECHO': (args) => {
        return [args || ''];
      },
      'TYPE': (args) => {
        if (!args) return ['Required parameter missing'];
        
        const file = args.toUpperCase();
        if (fileSystem[file]) {
          if (fileSystem[file] === 'Directory') {
            return ['Access denied'];
          }
          
          // Simulate file content
          if (file === 'README.TXT') {
            return [
              'MS-DOS README FILE',
              '=================',
              '',
              'This system is running MS-DOS 6.22.',
              '',
              'To get started, type HELP for a list of available commands.',
              '',
              'Copyright (C) Microsoft Corp 1981-1994'
            ];
          }
          return [`This is the content of ${file}`];
        }
        return [`File not found - ${args}`];
      }
    };
  
    // Process input commands
    function processCommand(input) {
      if (!input.trim()) {
        return;
      }
      
      const parts = input.trim().split(' ');
      const command = parts[0].toUpperCase();
      const args = parts.slice(1).join(' ');
      
      if (commands[command]) {
        const output = commands[command](args);
        addOutput(...output);
      } else {
        addOutput(`Bad command or file name - ${command}`);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
      }, 0);
    }
    
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        const fullCommand = `${currentDir}${currentInput}`;
        addOutput(fullCommand);
        processCommand(currentInput);
        currentInput = '';
        cursorPosition = 0;
      } else if (e.key === 'Backspace') {
        if (cursorPosition > 0) {
          currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
          cursorPosition--;
        }
        e.preventDefault();
      } else if (e.key === 'Delete') {
        if (cursorPosition < currentInput.length) {
          currentInput = currentInput.slice(0, cursorPosition) + currentInput.slice(cursorPosition + 1);
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        if (cursorPosition > 0) cursorPosition--;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        if (cursorPosition < currentInput.length) cursorPosition++;
        e.preventDefault();
      } else if (e.key === 'Home') {
        cursorPosition = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        cursorPosition = currentInput.length;
        e.preventDefault();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        currentInput = currentInput.slice(0, cursorPosition) + e.key + currentInput.slice(cursorPosition);
        cursorPosition++;
        e.preventDefault();
      }
    }
    
    function addOutput(...lines) {
      terminalOutput = [...terminalOutput, ...lines];
    }
    
    onMount(() => {
      // Startup sequence
      const bootSequence = [
        'Starting MS-DOS...',
        '',
        'HIMEM is testing extended memory...',
        'HIMEM: Extended memory passed test',
        '',
        'MS-DOS Version 6.22',
        'Copyright (C) Microsoft Corp 1981-1994',
        '',
        'C:\\>'
      ];
      
      let i = 0;
      const bootInterval = setInterval(() => {
        if (i < bootSequence.length - 1) {
          addOutput(bootSequence[i]);
          i++;
        } else {
          clearInterval(bootInterval);
          // Focus the input after boot sequence
          if (inputEl) inputEl.focus();
        }
      }, 300);
      
      // Cursor blink effect
      setInterval(() => {
        showCursor = !showCursor;
      }, 530);
      
      // Global key handler
      const handleGlobalClick = () => {
        if (inputEl) inputEl.focus();
      };
      
      document.addEventListener('click', handleGlobalClick);
      
      return () => {
        clearInterval(bootInterval);
        document.removeEventListener('click', handleGlobalClick);
      };
    });
  </script>
  
  <div class="fixed inset-0 bg-black overflow-hidden">
    <!-- Terminal content -->
    <div
      bind:this={terminalEl}
      class="terminal-wrapper w-full h-full p-4 overflow-y-auto whitespace-pre font-win11 text-white"
      tabindex="-1"
    >
      {#each terminalOutput as line}
        <div>{line}</div>
      {/each}
      
      <!-- Current input line -->
      <div class="flex">
        <span>{currentDir}</span>
        <span class="relative">
          <span>{currentInput}</span>
          <!-- Cursor -->
          {#if showCursor}
            <span class="absolute bottom-0 top-0 w-2 bg-white" style="left: {cursorPosition * 0.6}rem"></span>
          {/if}
        </span>
      </div>
    </div>
    
    <!-- Hidden input for keyboard handling -->
    <input
      bind:this={inputEl}
      class="fixed opacity-0 pointer-events-none"
      on:keydown={handleKeyDown}
    />
  </div>
  
  <style>
    /* Import Windows 11 style fonts */
    @import url('https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;700&display=swap');
    
    /* Font family for Windows 11 Terminal */
    .font-win11 {
      font-family: 'Cascadia Code', 'Consolas', monospace;
      font-size: 16px;
      letter-spacing: 0;
      line-height: 1.2;
    }
    
    /* The most basic styling for the terminal */
    .terminal-wrapper {
      position: relative;
      background-color: #0C0C0C; /* Windows Terminal default background */
    }
    
    /* Animated scan lines overlay */
    .terminal-wrapper::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0) 50%,
        rgba(255, 255, 255, 0.03) 50%
      );
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 2;
      animation: scanLines 0.5s linear infinite;
    }
    
    /* Subtle vignette effect */
    .terminal-wrapper::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 1;
    }
  
    /* Basic styling */
    :global(html), :global(body) {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
      background: black;
      cursor: text;
    }
    
    /* Animation for scan lines */
    @keyframes scanLines {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(4px);
      }
    }
  </style>