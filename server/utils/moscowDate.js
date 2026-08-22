export const getMoscowDateString = (date = new Date()) => {
  const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return moscowDate.toISOString().slice(0, 10);
};

export const getNextMoscowMidnightISO = (date = new Date()) => {
  const moscowNow = new Date(date.getTime() + 3 * 60 * 60 * 1000);

  const nextMoscowMidnightAsUTC = new Date(
    Date.UTC(
      moscowNow.getUTCFullYear(),
      moscowNow.getUTCMonth(),
      moscowNow.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  return new Date(
    nextMoscowMidnightAsUTC.getTime() - 3 * 60 * 60 * 1000,
  ).toISOString();
};
