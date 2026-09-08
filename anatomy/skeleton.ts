import type { Vec3 } from '@/biomechanics/vectors';
export type BoneId = 'humerus' | 'radius' | 'ulna';
export const skeleton = {
  source: {
    name: 'BodyParts3D',
    creator: 'The Database Center for Life Science',
    license: 'CC BY-SA 2.1 Japan',
    url: 'https://github.com/Kevin-Mattheus-Moerman/BodyParts3D',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
  },
  // Estimated registration landmarks in the source atlas frame (millimetres).
  // The mesh surfaces are atlas-derived; frame registration is approximate.
  registration: {
    elbow: [-215, -64, 1056] as Vec3,
    shoulder: [-164, -68, 1325] as Vec3,
    wrist: [-251, -110, 825] as Vec3,
  },
  bones: [
    {
      id: 'humerus' as const,
      name: 'Humerus',
      fma: 23130,
      segment: 'upperArm' as const,
      asset: '/models/humerus.stl',
      features: [
        'Humeral head',
        'Greater and lesser tubercles',
        'Olecranon fossa',
        'Trochlea',
        'Capitulum',
        'Medial and lateral epicondyles',
      ],
    },
    {
      id: 'radius' as const,
      name: 'Radius',
      fma: 23464,
      segment: 'forearm' as const,
      asset: '/models/radius.stl',
      features: [
        'Radial head',
        'Radial neck',
        'Radial tuberosity',
        'Styloid process',
      ],
    },
    {
      id: 'ulna' as const,
      name: 'Ulna',
      fma: 23467,
      segment: 'forearm' as const,
      asset: '/models/ulna.stl',
      features: [
        'Olecranon',
        'Trochlear notch',
        'Coronoid process',
        'Radial notch',
        'Ulnar head',
      ],
    },
  ],
  joint: {
    id: 'elbow',
    name: 'Elbow complex',
    axis: [0, 0, 1] as Vec3,
    range: [0, 140],
    articulations: [
      {
        name: 'Humeroulnar',
        surfaces: ['Humeral trochlea', 'Ulnar trochlear notch'],
      },
      { name: 'Humeroradial', surfaces: ['Humeral capitulum', 'Radial head'] },
      {
        name: 'Proximal radioulnar',
        surfaces: ['Radial head', 'Ulnar radial notch'],
      },
    ],
    kinematics:
      'Humeroulnar flexion–extension (0–140°) plus radius spin about the forearm axis (0° supinated to 180° pronated). Ulna does not pronate. No contact solver.',
  },
};
