// getPhilippineTime.ts
export const getPhilippineTime = (): Date => {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + 8 * 60 * 60 * 1000);
};

export const getPhilippineTimeString = (): string => {
  const philippineTime = getPhilippineTime();
  return philippineTime.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

console.log(getPhilippineTime);