export interface Actuator {
  momentArm: number;
  capacity: number;
}

function clampForce(force: number, capacity: number) {
  return Math.min(capacity, Math.max(0, force));
}

function evaluate(actuators: Actuator[], lambda: number) {
  return actuators.map((m) =>
    clampForce(lambda * m.momentArm * m.capacity * m.capacity, m.capacity),
  );
}

function torqueOf(actuators: Actuator[], forces: number[]) {
  return forces.reduce((t, f, i) => t + f * actuators[i].momentArm, 0);
}

function minEffort(actuators: Actuator[], required: number) {
  const maximumTorque = actuators.reduce(
    (t, m) => t + Math.max(0, m.momentArm) * m.capacity,
    0,
  );
  const minimumTorque = actuators.reduce(
    (t, m) => t + Math.min(0, m.momentArm) * m.capacity,
    0,
  );
  const target = Math.min(maximumTorque, Math.max(minimumTorque, required));
  if (Math.abs(target) < 1e-12) {
    return {
      forces: actuators.map(() => 0),
      achievedTorque: 0,
      maximumTorque,
      minimumTorque,
    };
  }
  let low = -1,
    high = 1;
  while (torqueOf(actuators, evaluate(actuators, high)) < target - 1e-10 && high < 1e16)
    high = high <= 0 ? 1 : high * 2;
  while (torqueOf(actuators, evaluate(actuators, low)) > target + 1e-10 && low > -1e16)
    low = low >= 0 ? -1 : low * 2;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2;
    if (torqueOf(actuators, evaluate(actuators, mid)) < target) low = mid;
    else high = mid;
  }
  const forces = evaluate(actuators, (low + high) / 2);
  return {
    forces,
    achievedTorque: torqueOf(actuators, forces),
    maximumTorque,
    minimumTorque,
  };
}

// Convex quadratic recruitment: min sum (F_i / capacity_i)^2
// subject to sum r_i F_i = required and 0 ≤ F_i ≤ capacity_i.
// r_i may be positive (flexion) or negative (extension).
// Co-contraction adds opposing force, then re-solves agonists for net torque.
export function recruit(
  actuators: Actuator[],
  required: number,
  coContraction = 0,
) {
  const seed = minEffort(actuators, required);
  const forces = seed.forces.slice();
  if (coContraction > 0) {
    const sense = required >= 0 ? 1 : -1;
    for (let i = 0; i < actuators.length; i++) {
      if (actuators[i].momentArm * sense < -1e-8) {
        forces[i] = Math.max(
          forces[i],
          coContraction * actuators[i].capacity,
        );
      }
    }
    const antagonistTorque = forces.reduce(
      (t, f, i) =>
        actuators[i].momentArm * sense < -1e-8
          ? t + f * actuators[i].momentArm
          : t,
      0,
    );
    const remaining = required - antagonistTorque;
    const agonists = actuators.map((m) =>
      m.momentArm * sense > 1e-8
        ? { momentArm: m.momentArm, capacity: m.capacity }
        : { momentArm: 0, capacity: 0 },
    );
    const second = minEffort(agonists, remaining);
    for (let i = 0; i < actuators.length; i++) {
      if (agonists[i].capacity > 0) forces[i] = second.forces[i];
    }
  }
  const achievedTorque = torqueOf(actuators, forces);
  const residual = required - achievedTorque;
  return {
    forces,
    achievedTorque,
    maximumTorque: seed.maximumTorque,
    minimumTorque: seed.minimumTorque,
    residual,
    feasible: Math.abs(residual) <= 1e-6,
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
