// Pin the timezone so date/time-formatting tests are deterministic
// regardless of the machine or CI runner's local timezone.
process.env.TZ = 'UTC';

import '@testing-library/jest-dom';
