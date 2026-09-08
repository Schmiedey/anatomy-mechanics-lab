export interface Actuator {
  momentArm: number;
  capacity: number;
}
// Convex quadratic recruitment: min sum (F_i / capacity_i)^2.
// KKT: F_i = clamp(lambda * r_i * capacity_i^2, 0, capacity_i).
// Monotone dual bisection handles active bounds without a general-purpose optimizer.
export function recruit(actuators: Actuator[], required: number) {
  const demand = Math.max(0, required),
    maximumTorque = actuators.reduce(
      (t, m) => t + Math.max(0, m.momentArm) * m.capacity,
      0,
    ),
    target = Math.min(demand, maximumTorque);
  const evaluate = (lambda: number) =>
    actuators.map((m) =>
      Math.min(
        m.capacity,
        Math.max(0, lambda * m.momentArm * m.capacity * m.capacity),
      ),
    );
  const torque = (forces: number[]) =>
    forces.reduce((t, f, i) => t + f * actuators[i].momentArm, 0);
  let low = 0,
    high = 1;
  while (torque(evaluate(high)) < target - 1e-10 && high < 1e16) high *= 2;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2;
    if (torque(evaluate(mid)) < target) low = mid;
    else high = mid;
  }
  const forces =
      demand === 0 ? actuators.map(() => 0) : evaluate((low + high) / 2),
    achievedTorque = torque(forces);
  return {
    forces,
    achievedTorque,
    maximumTorque,
    residual: demand - achievedTorque,
    feasible: demand <= maximumTorque + 1e-7,
    objective: forces.reduce(
      (t, f, i) =>
        t +
        (actuators[i].capacity > 0
          ? Math.pow(f / actuators[i].capacity, 2)
          : 0),
      0,
    ),
  };
}
