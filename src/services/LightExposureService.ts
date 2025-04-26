import { getDatabase, ref, set, get } from 'firebase/database';
import { getPhilippineTime } from '../utils/getPhilippineTime';

class LightExposureService {
  private db = getDatabase();
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Run immediately and then every 30 seconds
    this.calculateProgress();
    this.interval = setInterval(() => this.calculateProgress(), 30000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  private async calculateProgress() {
    try {
      const settingsSnapshot = await get(ref(this.db, 'lightExposure'));
      if (!settingsSnapshot.exists()) return;
      
      const { startTime, duration } = settingsSnapshot.val();
      if (!startTime || !duration) return;

      const now = getPhilippineTime();
      const currentTime = now.getTime();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      
      const { hours: startH, minutes: startM } = this.parseTime(startTime);
      const startTimeInMinutes = startH * 60 + startM;
      const durationInMinutes = parseFloat(duration) * 60;
      const endTimeInMinutes = (startTimeInMinutes + durationInMinutes) % 1440;

      // Check if we're in the scheduled period
      const isOvernight = startTimeInMinutes + durationInMinutes > 1440;
      const isInScheduledTime = isOvernight
        ? currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes
        : currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;

      // Load current light value
      const lightSnapshot = await get(ref(this.db, 'sensors/lightValue'));
      const lightValue = lightSnapshot.exists() ? lightSnapshot.val() : 'Bright';

      if (isInScheduledTime) {
        const elapsed = isOvernight
          ? (currentTimeInMinutes >= startTimeInMinutes
              ? currentTimeInMinutes - startTimeInMinutes
              : (1440 - startTimeInMinutes) + currentTimeInMinutes)
          : currentTimeInMinutes - startTimeInMinutes;
        
        const percentage = Math.min(100, (elapsed / durationInMinutes) * 100);
        await set(ref(this.db, 'lightExposure/lightExPercentage'), Math.round(percentage));
        
        // Reset countdown
        await set(ref(this.db, 'lightExposure/countdownStartTime'), null);
        await set(ref(this.db, 'lightExposure/countdownPercentage'), 100);
      } else {
        const exposurePercent = currentTimeInMinutes < startTimeInMinutes ? 0 : 100;
        await set(ref(this.db, 'lightExposure/lightExPercentage'), exposurePercent);

        if (lightValue !== 'Bright') {
          const countdownSnapshot = await get(ref(this.db, 'lightExposure/countdownStartTime'));
          const countdownStartTime = countdownSnapshot.exists() ? countdownSnapshot.val() : null;
          const countdownDuration = 8 * 60 * 60 * 1000; // 8 hours

          if (countdownStartTime) {
            const elapsed = currentTime - countdownStartTime;
            if (elapsed < countdownDuration) {
              const remainingPercentage = Math.max(0, 100 - (elapsed / countdownDuration) * 100);
              await set(ref(this.db, 'lightExposure/countdownPercentage'), remainingPercentage);
            } else {
              await set(ref(this.db, 'lightExposure/countdownStartTime'), null);
              await set(ref(this.db, 'lightExposure/countdownPercentage'), 0);
            }
          } else {
            // Start new countdown
            await set(ref(this.db, 'lightExposure/countdownStartTime'), currentTime);
            await set(ref(this.db, 'lightExposure/countdownPercentage'), 100);
          }
        }
      }
    } catch (error) {
      console.error('Error in LightExposureService:', error);
    }
  }

  private parseTime(timeStr: string) {
    const [time, meridian] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }
}

export const lightExposureService = new LightExposureService();