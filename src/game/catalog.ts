import type { RelatedLesson } from '../modules/lessonCompanion'

export interface VisionLabChapter {
  id: string
  number: number
  title: string
  capability: string
  status: 'active' | 'queued' | 'locked'
}

export interface VisionLabLectureRef {
  id: string
  rangeLabel: string
  title: string
  courseName: string
  url?: string
}

export interface VisionLabMissionLevelPlan {
  id: string
  title: string
  goalDescription: string
  initialPipelineState: string
  expectedSolutionConditions: string[]
  failureConditions: string[]
  playableLevelId?: string
}

export interface VisionLabMissionSet {
  id: string
  chapterId: string
  title: string
  concept: string
  summary: string
  lecture: VisionLabLectureRef
  moduleId?: string
  relatedLesson?: RelatedLesson
  optionalInsight?: string
  levels: VisionLabMissionLevelPlan[]
}

const cs231nLecture1Url =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=vT1JzLTH4G4'
const cs231nLecture2Url =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=OoUX-nOEjG0'
const cs231nLecture34Url =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=d14TUNcbn1k'
const cs231nLecture57Url =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=bNb2fEVKeEo'
const cs231nDetectionUrl =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=nDPWywWRIRo'
const cs231nTemporalUrl =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=Gv9_4yMHFhI'
const cs231nAdvancedUrl =
  'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=ta5fdaqDT3M'

const cs231nIntroLesson: RelatedLesson = {
  courseName: 'Stanford CS231n',
  lessonTitle: 'Image Classification',
  relevance:
    'This mission set turns CS231n theory into a pipeline you can repair by hand.',
  url: cs231nLecture1Url,
  timing: 'after',
  resourceKind: 'video',
  buttonLabel: 'Open CS231n Lesson',
}

export const visionLabChapters: VisionLabChapter[] = [
  {
    id: 'seeing-the-signal',
    number: 1,
    title: 'Seeing the Signal',
    capability: 'Read raw light as structured signal.',
    status: 'queued',
  },
  {
    id: 'finding-shape',
    number: 2,
    title: 'Finding Shape',
    capability: 'Build and debug a shape-isolation pipeline.',
    status: 'active',
  },
  {
    id: 'understanding-space',
    number: 3,
    title: 'Understanding Space',
    capability: 'Recover geometry and perspective from the scene.',
    status: 'locked',
  },
  {
    id: 'tracking-motion',
    number: 4,
    title: 'Tracking Motion',
    capability: 'Stabilize identity over time.',
    status: 'locked',
  },
  {
    id: 'reading-the-human',
    number: 5,
    title: 'Reading the Human',
    capability: 'Decode landmarks, pose, and gestures.',
    status: 'locked',
  },
  {
    id: 'calibrate-the-machine',
    number: 6,
    title: 'Calibrate the Machine',
    capability: 'Align sensors, masks, and measurements.',
    status: 'locked',
  },
]

export const visionLabMissionSets: VisionLabMissionSet[] = [
  {
    id: 'what-is-seeing',
    chapterId: 'seeing-the-signal',
    title: 'What is Seeing?',
    concept: 'Raw pixels become usable signal only after preprocessing.',
    summary:
      'Start with a feed the machine cannot read, then recover usable separation.',
    lecture: {
      id: 'lecture-1',
      rangeLabel: 'Lecture 1',
      title: 'Introduction / Image Classification',
      courseName: 'Stanford CS231n',
      url: cs231nLecture1Url,
    },
    relatedLesson: cs231nIntroLesson,
    levels: [
      {
        id: 'raw-image-nothing-detected',
        title: 'Raw Image -> Nothing Detected',
        goalDescription: 'See that an untreated image does not isolate the target.',
        initialPipelineState: 'Input only. No preprocessing. No segmentation.',
        expectedSolutionConditions: ['The player identifies that raw pixels are insufficient.'],
        failureConditions: ['The target never isolates from the background.'],
        playableLevelId: 'raw-feed',
      },
      {
        id: 'brightness-contrast-signal-emerges',
        title: 'Brightness / Contrast -> Signal Emerges',
        goalDescription: 'Adjust signal range until structure starts separating from noise.',
        initialPipelineState: 'Low-contrast scan with weak feature separation.',
        expectedSolutionConditions: ['The target region emerges from the background field.'],
        failureConditions: ['Signal remains too flat to split target from background.'],
        playableLevelId: 'signal-emerges',
      },
      {
        id: 'threshold-first-segmentation',
        title: 'Threshold -> First Segmentation',
        goalDescription: 'Create the first usable binary split between target and background.',
        initialPipelineState: 'Visible signal, but no segmentation stage.',
        expectedSolutionConditions: ['A first binary mask isolates the target region.'],
        failureConditions: ['The threshold cuts out the target or keeps too much background.'],
        playableLevelId: 'first-segmentation',
      },
    ],
  },
  {
    id: 'separating-signal-from-noise',
    chapterId: 'seeing-the-signal',
    title: 'Separating Signal from Noise',
    concept: 'The machine learns which pixels belong to target versus background.',
    summary: 'Decision boundaries start as simple pixel-level choices.',
    lecture: {
      id: 'lecture-2',
      rangeLabel: 'Lecture 2',
      title: 'Linear Classification',
      courseName: 'Stanford CS231n',
      url: cs231nLecture2Url,
    },
    relatedLesson: {
      ...cs231nIntroLesson,
      lessonTitle: 'Linear Classification',
      relevance:
        'This mission set frames thresholding like a simple decision boundary over pixels.',
      url: cs231nLecture2Url,
    },
    levels: [
      {
        id: 'threshold-tuning',
        title: 'Threshold Tuning',
        goalDescription: 'Tune the decision cutoff until target pixels survive cleanly.',
        initialPipelineState: 'Threshold exists, but the split point is unstable.',
        expectedSolutionConditions: ['The mask keeps the target and rejects most background.'],
        failureConditions: ['Threshold too high or too low selects the wrong region.'],
        playableLevelId: 'threshold-tuning',
      },
      {
        id: 'incorrect-threshold-wrong-object',
        title: 'Incorrect Threshold -> Wrong Object Selected',
        goalDescription: 'See how a bad cutoff promotes the wrong candidate.',
        initialPipelineState: 'Distractors survive because the threshold is biased.',
        expectedSolutionConditions: ['The intended object survives while distractors drop out.'],
        failureConditions: ['A distractor becomes the dominant candidate.'],
        playableLevelId: 'wrong-object-threshold',
      },
      {
        id: 'decision-boundary-intuition',
        title: 'Decision Boundary Intuition',
        goalDescription: 'Build intuition for classifying target versus background pixels.',
        initialPipelineState: 'The scene contains overlapping intensity groups.',
        expectedSolutionConditions: ['The player learns why a simple cutoff acts like a classifier.'],
        failureConditions: ['Pixel classes remain mixed and unstable.'],
        playableLevelId: 'decision-boundary',
      },
    ],
  },
  {
    id: 'building-a-pipeline',
    chapterId: 'finding-shape',
    title: 'Building a Pipeline',
    concept: 'Order and dependency matter. The machine fails when the stack is incomplete.',
    summary: 'Repair the stack one dependency at a time until contours can form.',
    lecture: {
      id: 'lecture-3-4',
      rangeLabel: 'Lecture 3-4',
      title: 'Neural Networks / Backprop',
      courseName: 'Stanford CS231n',
      url: cs231nLecture34Url,
    },
    moduleId: 'find-shape',
    relatedLesson: {
      ...cs231nIntroLesson,
      lessonTitle: 'Neural Networks / Backprop',
      relevance:
        'This mission set teaches layered processing by making each dependency visible and editable.',
      url: cs231nLecture34Url,
    },
    levels: [
      {
        id: 'pipeline-missing-step',
        title: 'Missing Step',
        goalDescription: 'Restore the missing operation that lets contours resolve.',
        initialPipelineState: 'The mask line is incomplete, so downstream steps wait forever.',
        expectedSolutionConditions: ['The mask operation is assigned.', 'Contours can form again.'],
        failureConditions: ['Mask operation missing.', 'Contours never resolve.'],
        playableLevelId: 'missing-step',
      },
      {
        id: 'pipeline-wrong-order',
        title: 'Wrong Order',
        goalDescription: 'Reorder the steps so each stage receives valid input.',
        initialPipelineState: 'Masking and contour steps appear before the blur they depend on.',
        expectedSolutionConditions: ['Blur feeds mask before contour extraction runs.'],
        failureConditions: ['Operation order stays broken and inputs arrive too early.'],
        playableLevelId: 'wrong-order',
      },
      {
        id: 'pipeline-incorrect-transform',
        title: 'Incorrect Transform',
        goalDescription: 'Swap in the transform that preserves usable structure.',
        initialPipelineState: 'A weak transform keeps the wrong feature response alive.',
        expectedSolutionConditions: ['The correct transform keeps the target structure readable.'],
        failureConditions: ['The transform distorts or suppresses the useful signal.'],
      },
      {
        id: 'pipeline-breaks-if-steps-are-incorrect',
        title: 'Pipeline Breaks if Steps Are Incorrect',
        goalDescription: 'See the whole stack fail when multiple dependencies are wrong.',
        initialPipelineState: 'Several stages are weak, missing, or misordered at once.',
        expectedSolutionConditions: ['The full stack returns to a stable contour lock.'],
        failureConditions: ['Multiple broken steps prevent a stable target contour.'],
      },
    ],
  },
  {
    id: 'feature-extraction',
    chapterId: 'finding-shape',
    title: 'Feature Extraction',
    concept: 'Filters reveal local structure before the machine can choose a target.',
    summary: 'Use blur and edge operators to decide which structure survives.',
    lecture: {
      id: 'lecture-5-7',
      rangeLabel: 'Lecture 5-7',
      title: 'Convolutional Neural Networks',
      courseName: 'Stanford CS231n',
      url: cs231nLecture57Url,
    },
    moduleId: 'find-shape',
    relatedLesson: {
      ...cs231nIntroLesson,
      lessonTitle: 'Convolutional Neural Networks',
      relevance:
        'This mission set connects hand-tuned filters to the feature detectors learned by CNNs.',
      url: cs231nLecture57Url,
    },
    optionalInsight:
      'What you are doing manually here is what CNN filters learn automatically.',
    levels: [
      {
        id: 'feature-edge-detection',
        title: 'Edge Detection',
        goalDescription: 'Use an edge operator to expose the target boundary.',
        initialPipelineState: 'Contours are hidden inside a low-contrast intensity field.',
        expectedSolutionConditions: ['Edge response outlines the target cleanly.'],
        failureConditions: ['Edges remain too weak or too fragmented.'],
        playableLevelId: 'edge-filter',
      },
      {
        id: 'feature-blur-vs-edge',
        title: 'Blur vs Edge Interaction',
        goalDescription: 'Balance smoothing against edge loss.',
        initialPipelineState: 'Noise and edge sensitivity fight each other.',
        expectedSolutionConditions: ['Blur suppresses noise without erasing the shape boundary.'],
        failureConditions: ['Noise dominates or blur wipes out the edge signal.'],
        playableLevelId: 'bad-parameters',
      },
      {
        id: 'feature-filter-effect',
        title: 'Filter Effect',
        goalDescription: 'See how different filters emphasize different local patterns.',
        initialPipelineState: 'Multiple filter choices are available, but not equally useful.',
        expectedSolutionConditions: ['The chosen filter improves feature separation.'],
        failureConditions: ['The active filter preserves the wrong structures.'],
      },
      {
        id: 'feature-local-pattern-extraction',
        title: 'Local Pattern Extraction',
        goalDescription: 'Use local features to recover the target from clutter.',
        initialPipelineState: 'Global appearance is ambiguous, but local structure is informative.',
        expectedSolutionConditions: ['The target stands out through local pattern response.'],
        failureConditions: ['The machine keeps responding to background texture.'],
      },
    ],
  },
  {
    id: 'finding-objects',
    chapterId: 'finding-shape',
    title: 'Finding Objects',
    concept: 'Once features are stable, the machine still has to pick the right object.',
    summary: 'Use contours and selection rules to reject the wrong candidate.',
    lecture: {
      id: 'lecture-8',
      rangeLabel: 'Lecture 8',
      title: 'Detection',
      courseName: 'Stanford CS231n',
      url: cs231nDetectionUrl,
    },
    moduleId: 'find-shape',
    relatedLesson: {
      ...cs231nIntroLesson,
      lessonTitle: 'Detection',
      relevance:
        'This mission set focuses on object proposals and choosing the right candidate in a crowded scene.',
      url: cs231nDetectionUrl,
    },
    levels: [
      {
        id: 'object-contour-detection',
        title: 'Contour Detection',
        goalDescription: 'Turn a clean mask into explicit contour candidates.',
        initialPipelineState: 'Mask exists, but object proposals are not yet extracted.',
        expectedSolutionConditions: ['Contours are found and passed to target selection.'],
        failureConditions: ['Contours not found.', 'Contour list is unstable.'],
      },
      {
        id: 'object-multiple-objects',
        title: 'Multiple Objects in Scene',
        goalDescription: 'Reject the distractor when several candidates appear.',
        initialPipelineState: 'Several shapes compete for the target slot.',
        expectedSolutionConditions: ['The selector rejects the distractor and keeps the target.'],
        failureConditions: ['Wrong contour selected.', 'Target selection unstable.'],
        playableLevelId: 'false-target',
      },
      {
        id: 'object-eliminate-incorrect-targets',
        title: 'Eliminate Incorrect Targets',
        goalDescription: 'Repair the full stack until the machine chooses the true object reliably.',
        initialPipelineState: 'Multiple weak steps and wrong selectors destabilize the lock.',
        expectedSolutionConditions: ['False positives are reduced.', 'The true target locks cleanly.'],
        failureConditions: ['Noise still dominating the mask.', 'Wrong contour selected.'],
        playableLevelId: 'full-debug',
      },
    ],
  },
  {
    id: 'understanding-space',
    chapterId: 'understanding-space',
    title: 'Understanding Space',
    concept: 'The machine learns where the object is and how the scene is warped.',
    summary: 'Recover corners, quads, and perspective from geometric cues.',
    lecture: {
      id: 'lecture-9',
      rangeLabel: 'Lecture 9',
      title: 'Localization',
      courseName: 'Stanford CS231n',
      url: cs231nDetectionUrl,
    },
    levels: [
      {
        id: 'space-corner-detection',
        title: 'Corner Detection',
        goalDescription: 'Find stable anchor points in the scene.',
        initialPipelineState: 'The machine sees edges but not geometric anchors.',
        expectedSolutionConditions: ['Corners become stable reference points.'],
        failureConditions: ['Corners drift or fail to appear.'],
      },
      {
        id: 'space-quad-mapping',
        title: 'Quad Mapping',
        goalDescription: 'Link corners into a consistent quadrilateral.',
        initialPipelineState: 'Reference points exist, but geometry is not assembled.',
        expectedSolutionConditions: ['A valid quad locks onto the target plane.'],
        failureConditions: ['The quad collapses or links the wrong corners.'],
      },
      {
        id: 'space-perspective-transform',
        title: 'Perspective Transform',
        goalDescription: 'Warp the target plane into a normalized view.',
        initialPipelineState: 'The target is detected, but perspective still distorts it.',
        expectedSolutionConditions: ['The warped result is aligned and readable.'],
        failureConditions: ['The transform maps the plane incorrectly.'],
      },
    ],
  },
  {
    id: 'precise-masking',
    chapterId: 'finding-shape',
    title: 'Precise Masking',
    concept: 'Segmentation is about exact boundaries, not rough guesses.',
    summary: 'Refine masks until the extracted shape is exact and stable.',
    lecture: {
      id: 'lecture-10-plus',
      rangeLabel: 'Lecture 10+',
      title: 'Segmentation',
      courseName: 'Stanford CS231n',
      url: cs231nDetectionUrl,
    },
    levels: [
      {
        id: 'mask-refinement',
        title: 'Mask Refinement',
        goalDescription: 'Tighten the mask around the target body.',
        initialPipelineState: 'The object is visible, but the mask bleeds into the background.',
        expectedSolutionConditions: ['Mask edges align closely to the target outline.'],
        failureConditions: ['Mask still leaks or erodes the true target.'],
      },
      {
        id: 'mask-noise-cleanup',
        title: 'Noise Cleanup',
        goalDescription: 'Remove small false regions from the mask.',
        initialPipelineState: 'The mask contains noise islands and false returns.',
        expectedSolutionConditions: ['False islands are removed while the target stays intact.'],
        failureConditions: ['Noise remains dominant or target pixels are lost.'],
      },
      {
        id: 'mask-exact-shape-extraction',
        title: 'Exact Shape Extraction',
        goalDescription: 'Produce a precise extraction of the intended shape.',
        initialPipelineState: 'The object is isolated loosely but not precisely.',
        expectedSolutionConditions: ['The final mask matches the shape closely.'],
        failureConditions: ['Extraction remains approximate or unstable.'],
      },
    ],
  },
  {
    id: 'tracking-over-time',
    chapterId: 'tracking-motion',
    title: 'Tracking Over Time',
    concept: 'Temporal consistency matters as much as single-frame detection.',
    summary: 'Distinguish real motion from flicker and hold identity over time.',
    lecture: {
      id: 'lecture-11-plus',
      rangeLabel: 'Lecture 11+',
      title: 'Video / Temporal',
      courseName: 'Stanford CS231n',
      url: cs231nTemporalUrl,
    },
    levels: [
      {
        id: 'motion-detection',
        title: 'Motion Detection',
        goalDescription: 'Detect that something is moving at all.',
        initialPipelineState: 'Single-frame features exist, but time is ignored.',
        expectedSolutionConditions: ['Movement appears as a stable temporal signal.'],
        failureConditions: ['Static noise is mistaken for motion.'],
      },
      {
        id: 'temporal-stability',
        title: 'Temporal Stability',
        goalDescription: 'Keep the lock stable over successive frames.',
        initialPipelineState: 'Per-frame detections flicker and drift.',
        expectedSolutionConditions: ['The target remains stable over time.'],
        failureConditions: ['Tracking flickers or swaps identity.'],
      },
      {
        id: 'real-movement-vs-noise',
        title: 'Distinguish Real Movement from Noise',
        goalDescription: 'Reject flicker and sensor noise that look like motion.',
        initialPipelineState: 'Temporal noise competes with true movement.',
        expectedSolutionConditions: ['Real movement survives while noise is rejected.'],
        failureConditions: ['Noise still triggers false movement detections.'],
      },
    ],
  },
  {
    id: 'reading-the-human',
    chapterId: 'reading-the-human',
    title: 'Reading the Human',
    concept: 'The machine learns structured landmarks instead of raw silhouettes.',
    summary: 'Move from detecting a person to decoding pose, hands, and gestures.',
    lecture: {
      id: 'later-lectures',
      rangeLabel: 'Later Lectures',
      title: 'Pose / Advanced',
      courseName: 'Stanford CS231n',
      url: cs231nAdvancedUrl,
    },
    levels: [
      {
        id: 'hand-landmarks',
        title: 'Hand Landmarks',
        goalDescription: 'Resolve finger joints and palm anchors.',
        initialPipelineState: 'A hand is detected, but its structure is unresolved.',
        expectedSolutionConditions: ['Hand landmarks align consistently.'],
        failureConditions: ['Landmarks drift or attach to the wrong points.'],
      },
      {
        id: 'pose-detection',
        title: 'Pose Detection',
        goalDescription: 'Recover major body landmarks.',
        initialPipelineState: 'The body is visible, but posture is not decoded.',
        expectedSolutionConditions: ['Pose landmarks describe the body configuration.'],
        failureConditions: ['The pose skeleton is incomplete or unstable.'],
      },
      {
        id: 'gesture-triggering',
        title: 'Gesture Triggering',
        goalDescription: 'Use landmark structure to trigger machine actions.',
        initialPipelineState: 'Landmarks exist, but no semantic gesture response is attached.',
        expectedSolutionConditions: ['A stable gesture activates the expected trigger.'],
        failureConditions: ['False gestures or unstable triggers fire.'],
      },
    ],
  },
]

export function getMissionSetById(id: string) {
  return visionLabMissionSets.find((missionSet) => missionSet.id === id) ?? null
}

export function getPlayableMissionSetsForModule(moduleId: string) {
  return visionLabMissionSets.filter(
    (missionSet) =>
      missionSet.moduleId === moduleId &&
      missionSet.levels.some((level) => level.playableLevelId),
  )
}

export function getPlayableLevelIdsForMissionSet(missionSet: VisionLabMissionSet) {
  return missionSet.levels.flatMap((level) => (level.playableLevelId ? [level.playableLevelId] : []))
}
