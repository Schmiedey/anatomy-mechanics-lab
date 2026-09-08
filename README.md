# Anatomy Mechanics Lab

A local Next.js / React / TypeScript / React Three Fiber elbow biomechanics simulator. No AI service, API backend, database, authentication or account is required.

## Run locally

Node 22.13+ is required.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. The app includes its anatomical assets; it does not fetch models from third-party services at runtime.

```sh
npm test           # deterministic mechanics tests
npm run typecheck  # strict TypeScript
npm run lint       # application and engine source; vendored UI excluded
npm run test:e2e   # Chrome: complete experiment/comparison flow and mobile layout
npm run build      # generates standalone static output in out/
```

The browser tests use installed Google Chrome. The production output can be served by any ordinary static HTTP server. `npm start` starts the local development server.

## Architecture

- `anatomy/model.ts`: muscle properties, path primitives, anthropometric assumptions, editable state.
- `anatomy/skeleton.ts`: atlas provenance, bones, segment membership, registration landmarks and elbow articulations.
- `biomechanics/`: reusable SI vector math, 2-DOF kinematics, wrapping, via points, force capacity, external loads, signed recruitment and literature-curve comparison. No React or Three.js dependencies.
- `components/lab/`: controls, plots, comparisons, validation, raw inspector and interactive atlas meshes.
- `public/models/`: locally bundled BodyParts3D anatomical assets, license and attribution.

## Equations and conventions

All engine lengths are metres, forces newtons and torques N·m. Angles enter the API in degrees. The humerus is fixed. At zero flexion, the distal segment points down −Y. Positive flexion is rotation about +Z. Gravity is `[0, -9.80665, 0]` m/s².

The wrist is `Rz(q) [0, -forearmLength, 0]`. The load acts at `forearmLength × loadPosition`. External torque is the negative Z component of `r × F`. Optional arm self-weight adds forearm and hand gravitational torques. A zero dumbbell load therefore gives zero _external load torque_, while arm self-weight may still require muscle force.

For each muscle path, length is the polyline through origin, active via points, wrapping contacts and insertion. Signed moment arms are `-dL/dθ` from that length: flexion about +Z, pronation about the forearm axis. Positive flexion moment arms produce flexion; biceps also has a supination moment arm because it inserts on the radius. A wrapping cylinder or sphere is used only when the chord would intersect the obstacle.

Recruitment minimizes `Σ (Fi / capacity_i)²`, subject to `Σ ri Fi = requiredTorque` and `0 ≤ Fi ≤ capacity_i`. Moment arms `ri` may be negative (extensors). The scalar dual solution is `Fi = clamp(λ ri capacity_i², 0, capacity_i)`. Monotone bisection finds λ over the full real line. Optional co-contraction raises antagonist force, then re-solves agonists so net torque is preserved when feasible. Infeasible demands saturate useful actuators, retain the force bounds and report the unmet torque explicitly.

The optional simplified Hill-type capacity uses:

- `fiberLength = max(0.001, (pathLength - tendonSlackLength) / cos(pennation))`
- `forceLength = exp(-((fiberLength / optimalFiberLength - 1) / 0.56)²)`
- `fiberVelocity = -momentArm × angularVelocity / cos(pennation)`
- concentric / eccentric force–velocity curves, normalized in optimal fiber lengths/s
- `capacity = Fmax × strength × forceLength × forceVelocity × cos(pennation)`

The displayed recruitment fraction is `Fi/capacity_i`, a model estimate, not measured neural activation. The animation is a quasi-static angle sweep. Prescribed velocity affects the optional capacity curve only; acceleration, inertia, passive elasticity and tendon compliance are absent.

Mechanical advantage is muscle moment arm divided by the perpendicular load moment arm. It is undefined at zero load moment arm. Vector lengths use square-root magnitude scaling; their numerical magnitudes are not altered.

## Anatomy and limitations

The humerus, radius, ulna, biceps long head, biceps short head, brachialis and brachioradialis are actual BodyParts3D atlas surface meshes. Triceps and anconeus are path actuators without atlas meshes. The right-sided FMA identifiers are recorded in `public/models/ATTRIBUTION.md`. The humeral trochlea/capitulum, ulnar trochlear notch and radial head are part of the source surfaces. Use **Inspect elbow joint** for the skeletal close-up, and orbit to view the articulation from other directions.

Atlas bone-frame registration uses estimated landmarks, not a clinically fitted joint axis. Segment length changes stretch bone geometry longitudinally. Muscle surfaces are aligned and stretched along the origin–insertion chord; their mesh vertices do not define moment arms. Mechanical paths (via points and wrapping) are the source of moment arms. Attachments and physiology are illustrative reference assumptions. The model flexes the ulna and spins the radius; it does not solve bone contact, cartilage deformation or ligaments. No visual hand is included; its optional lumped mass is included in arm self-weight.

The **Validation** tab compares simulated moment arms with characteristic curves reconstructed from Murray, Delp and Buchanan (J Biomech 1995 and 2002). Those references are literature-derived peaks, peak angles and ROM variation, not a point-by-point specimen fit. RMSE on that tab is a geometry check, not a claim of clinical validity.

The model is an extensible educational engineering simulator, not a validated clinical or subject-specific musculoskeletal model. The atlas detail must not be confused with greater accuracy in the mechanical assumptions.

## Asset attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.

- Source: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D
- License: https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en
- Mitsuhashi N, et al. _BodyParts3D: 3D structure database for anatomical concepts_. Nucleic Acids Res. 2009;37:D782–D785. https://doi.org/10.1093/nar/gkn613
- Recruitment method reference: https://opensimconfluence.atlassian.net/wiki/spaces/OpenSim/pages/53089619/How+Static+Optimization+Works

The adapted model assets retain CC BY-SA 2.1 Japan. Registration, unit conversion, vertex welding, normal recomputation and deformation are documented in the asset attribution file.
