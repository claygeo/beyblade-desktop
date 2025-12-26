import { Game } from './lib/game';
import { Settings } from './lib/settings';

async function main() {
  const canvas = document.getElementById('arena') as HTMLCanvasElement;
  const launchBtn = document.getElementById('launch-btn')!;
  const restartBtn = document.getElementById('restart-btn')!;
  const settingsBtn = document.getElementById('settings-btn')!;
  const settingsModal = document.getElementById('settings-modal')!;
  const closeSettingsBtn = document.getElementById('close-settings')!;
  const exitBtn = document.getElementById('exit-btn')!;

  // Settings elements
  const countSlider = document.getElementById('beyblade-count') as HTMLInputElement;
  const countDisplay = document.getElementById('count-display')!;
  const durationSelect = document.getElementById('battle-duration') as HTMLSelectElement;
  const sizeSelect = document.getElementById('beyblade-size') as HTMLSelectElement;
  const soundToggle = document.getElementById('sound-toggle') as HTMLInputElement;
  const imageUpload = document.getElementById('image-upload') as HTMLInputElement;
  const customImagesGrid = document.getElementById('custom-images-grid')!;
  const clearCustomBtn = document.getElementById('clear-custom-btn')!;

  const settings = new Settings();
  const game = new Game(canvas, settings);

  // Initialize UI from saved settings
  countSlider.value = settings.beybladeCount.toString();
  countDisplay.textContent = settings.beybladeCount.toString();
  durationSelect.value = settings.battleDuration;
  sizeSelect.value = settings.beybladeSize;
  soundToggle.checked = settings.soundEnabled;
  updateCustomImagesGrid();

  await game.init();

  // Launch battle
  function launch() {
    game.launchBattle();
  }

  launchBtn.addEventListener('click', launch);
  restartBtn.addEventListener('click', launch);

  // Settings modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  // Exit button
  exitBtn.addEventListener('click', async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('exit_app');
    } catch (e) {
      window.close();
    }
  });

  // Settings controls
  countSlider.addEventListener('input', () => {
    const value = parseInt(countSlider.value);
    countDisplay.textContent = value.toString();
    settings.beybladeCount = value;
    settings.saveSettings();
  });

  durationSelect.addEventListener('change', () => {
    settings.battleDuration = durationSelect.value as any;
    settings.saveSettings();
  });

  sizeSelect.addEventListener('change', async () => {
    settings.beybladeSize = sizeSelect.value as any;
    settings.saveSettings();
  });

  soundToggle.addEventListener('change', () => {
    settings.soundEnabled = soundToggle.checked;
    settings.saveSettings();
  });

  // Custom image upload
  imageUpload.addEventListener('change', async () => {
    const files = imageUpload.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (settings.customImages.length >= 20) {
        alert('Maximum 20 custom images allowed');
        break;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        settings.addCustomImage(base64);
        updateCustomImagesGrid();
        await game.reloadImages();
      };
      reader.readAsDataURL(file);
    }
    
    imageUpload.value = '';
  });

  clearCustomBtn.addEventListener('click', async () => {
    if (settings.customImages.length === 0) return;
    if (confirm('Remove all custom beyblade images?')) {
      settings.clearCustomImages();
      updateCustomImagesGrid();
      await game.reloadImages();
    }
  });

  function updateCustomImagesGrid() {
    customImagesGrid.innerHTML = '';
    
    settings.customImages.forEach((base64, index) => {
      const item = document.createElement('div');
      item.className = 'custom-image-item';
      
      const img = document.createElement('img');
      img.src = base64;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.onclick = async () => {
        settings.removeCustomImage(index);
        updateCustomImagesGrid();
        await game.reloadImages();
      };
      
      item.appendChild(img);
      item.appendChild(removeBtn);
      customImagesGrid.appendChild(item);
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !settingsModal.classList.contains('hidden') === false) {
      e.preventDefault();
      launch();
    }
    if (e.code === 'Escape') {
      if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      }
    }
  });

  // Auto-launch first battle (longer delay to ensure everything is ready)
  setTimeout(launch, 800);
}

main().catch(console.error);