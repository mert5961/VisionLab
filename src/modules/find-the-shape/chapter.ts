import type { RelatedLesson } from '../lessonCompanion'
import { createStep } from './pipelineModel'
import type {
  FindShapeOperationId,
  FindShapeProgram,
  FindShapeSceneOptions,
} from './types'

export interface FindShapeLevelConfig {
  id: string
  missionSetId: string
  levelNumber: number
  title: string
  objective: string
  shortGoal: string
  helperHint: string
  successConditions: string[]
  failureConditions: string[]
  lessonNudgeDelaySeconds?: number
  lessonNudgeMessage?: string
  sceneSeed: number
  sceneOptions?: FindShapeSceneOptions
  initialProgram: FindShapeProgram
  solutionProgram: FindShapeProgram
  relatedLesson?: RelatedLesson
}

const lessonIntro: RelatedLesson = {
  courseName: 'Stanford CS231n',
  lessonTitle: 'Image Classification',
  relevance:
    'This chapter turns lecture ideas into hands-on debugging. It helps explain why raw pixels need preprocessing before they become reliable decisions.',
  url: 'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=OoUX-nOEjG0',
  timing: 'after',
  resourceKind: 'video',
  buttonLabel: 'Open CS231n Lesson',
}

const lessonLinear: RelatedLesson = {
  ...lessonIntro,
  lessonTitle: 'Linear Classification',
  relevance:
    'This mission set treats thresholding like a pixel-level decision boundary between target and background.',
  url: 'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=OoUX-nOEjG0',
}

const lessonNeural: RelatedLesson = {
  ...lessonIntro,
  lessonTitle: 'Neural Networks / Backprop',
  relevance:
    'This mission set teaches layered processing by making each dependency visible and editable.',
  url: 'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=d14TUNcbn1k',
}

const lessonCnn: RelatedLesson = {
  ...lessonIntro,
  lessonTitle: 'Convolutional Neural Networks',
  relevance:
    'This mission set connects hand-tuned filters to the local features that CNNs learn automatically.',
  url: 'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=bNb2fEVKeEo',
}

const lessonDetection: RelatedLesson = {
  ...lessonIntro,
  lessonTitle: 'Detection',
  relevance:
    'This mission set focuses on contour proposals, rejecting distractors, and choosing the right target.',
  url: 'https://www.youtube.com/watch?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv&v=nDPWywWRIRo',
}

export const findShapeChapter = {
  code: 'CH-02',
  title: 'Finding Shape',
  subtitle: 'Teach the machine to isolate the intended contour.',
  levels: [
    {
      id: 'raw-feed',
      missionSetId: 'what-is-seeing',
      levelNumber: 1,
      title: 'Raw Feed',
      objective: 'Convert the raw frame into a usable mono signal before the machine can see shape.',
      shortGoal: 'Replace the raw mono feed.',
      helperHint: 'Raw pixels are not yet a stable signal.',
      successConditions: [
        'Switch the mono stage to a usable grayscale conversion.',
        'Keep the rest of the stack stable enough to isolate the target.',
      ],
      failureConditions: ['Wrong grayscale feed.', 'Signal remains noisy.'],
      lessonNudgeDelaySeconds: 20,
      lessonNudgeMessage:
        'This mission is about turning raw pixels into a usable signal. If the stack still feels abstract, use the lecture as a quick reset on why preprocessing matters.',
      sceneSeed: 991,
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step(
          'step-mono',
          'mono',
          ['frame'],
          'max_channel',
          ['to_grayscale', 'extract_luma', 'max_channel'],
          false,
        ),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], true, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step(
          'step-mono',
          'mono',
          ['frame'],
          'to_grayscale',
          ['to_grayscale', 'extract_luma', 'max_channel'],
          false,
        ),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], true, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonIntro,
    },
    {
      id: 'signal-emerges',
      missionSetId: 'what-is-seeing',
      levelNumber: 2,
      title: 'Signal Emerges',
      objective: 'Use a smarter cutoff so the weak target separates from the background field.',
      shortGoal: 'Swap in a mask that survives weak contrast.',
      helperHint: 'Weak contrast needs a smarter cutoff.',
      successConditions: [
        'Use a mask stage that can recover the target from weak contrast.',
        'Keep the contour stage stable.',
      ],
      failureConditions: ['Noise still dominating the mask.', 'No contours detected.'],
      lessonNudgeDelaySeconds: 22,
      lessonNudgeMessage:
        'This mission is about making faint structure usable. The lecture can help reconnect that idea to early feature extraction from raw pixels.',
      sceneSeed: 1007,
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'high_pass_mask',
          ['binary_threshold', 'high_pass_mask', 'adaptive_cutoff'],
          false,
          {
            level: 184,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'adaptive_cutoff',
          ['binary_threshold', 'high_pass_mask', 'adaptive_cutoff'],
          false,
          {
            level: 156,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonIntro,
    },
    {
      id: 'first-segmentation',
      missionSetId: 'what-is-seeing',
      levelNumber: 3,
      title: 'First Segmentation',
      objective: 'Use thresholding to produce the first clean target mask.',
      shortGoal: 'Select the threshold stage.',
      helperHint: 'The machine needs a binary split before contours.',
      successConditions: [
        'Assign the threshold stage.',
        'Convert the image stream into one clean target region.',
      ],
      failureConditions: ['Mask operation missing.', 'Contours not found.'],
      lessonNudgeDelaySeconds: 22,
      lessonNudgeMessage:
        'This mission is the first true segmentation step. Use the lecture if you want the theory behind why a binary mask is such a big jump.',
      sceneSeed: 1029,
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          null,
          ['binary_threshold', 'adaptive_cutoff'],
          false,
          {
            level: 166,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'binary_threshold',
          ['binary_threshold', 'adaptive_cutoff'],
          false,
          {
            level: 166,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonIntro,
    },
    {
      id: 'threshold-tuning',
      missionSetId: 'separating-signal-from-noise',
      levelNumber: 1,
      title: 'Threshold Tuning',
      objective: 'Tune the cutoff until target pixels survive and background falls away.',
      shortGoal: 'Lower the threshold until the target survives.',
      helperHint: 'Threshold defines the pixel boundary.',
      successConditions: [
        'The mask keeps the target.',
        'Background pixels drop out of the selection.',
      ],
      failureConditions: ['Threshold too high.', 'No contours detected.'],
      lessonNudgeDelaySeconds: 20,
      lessonNudgeMessage:
        'This mission is the first real decision boundary. If it feels arbitrary, the lecture helps frame thresholding as simple classification.',
      sceneSeed: 1057,
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 214,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonLinear,
    },
    {
      id: 'wrong-object-threshold',
      missionSetId: 'separating-signal-from-noise',
      levelNumber: 2,
      title: 'Wrong Object',
      objective: 'Push the cutoff until the distractor drops out and the real target survives.',
      shortGoal: 'Reject the distractor with threshold.',
      helperHint: 'A bad pixel boundary keeps the wrong object alive.',
      successConditions: [
        'The distractor no longer dominates the mask.',
        'The real target becomes the best candidate.',
      ],
      failureConditions: ['Wrong contour selected.', 'Target selection unstable.'],
      lessonNudgeDelaySeconds: 20,
      lessonNudgeMessage:
        'This mission is about the wrong pixels surviving the boundary. The lecture helps explain why even a simple classifier can pick the wrong region.',
      sceneSeed: 1099,
      sceneOptions: {
        variant: 'false-target',
        targetCode: 'HX-21',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'binary_threshold',
          ['binary_threshold', 'adaptive_cutoff'],
          false,
          {
            level: 132,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'binary_threshold',
          ['binary_threshold', 'adaptive_cutoff'],
          false,
          {
            level: 166,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonLinear,
    },
    {
      id: 'decision-boundary',
      missionSetId: 'separating-signal-from-noise',
      levelNumber: 3,
      title: 'Decision Boundary',
      objective: 'Choose the mask rule that best separates target pixels from background pixels.',
      shortGoal: 'Choose the boundary rule that isolates the target.',
      helperHint: 'Pixel classification starts with the right decision rule.',
      successConditions: [
        'The chosen mask rule keeps the target and rejects most noise.',
        'Contour tracing becomes stable again.',
      ],
      failureConditions: ['Noise still dominating the mask.', 'Wrong contour selected.'],
      lessonNudgeDelaySeconds: 22,
      lessonNudgeMessage:
        'This mission turns a threshold into a classifier. Use the lecture if you want the theory behind why one boundary rule works better than another.',
      sceneSeed: 1131,
      sceneOptions: {
        variant: 'crowded',
        targetCode: 'HX-27',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'high_pass_mask',
          ['binary_threshold', 'high_pass_mask', 'adaptive_cutoff'],
          false,
          {
            level: 184,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'adaptive_cutoff',
          ['binary_threshold', 'high_pass_mask', 'adaptive_cutoff'],
          false,
          {
            level: 156,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonLinear,
    },
    {
      id: 'missing-step',
      missionSetId: 'building-a-pipeline',
      levelNumber: 1,
      title: 'Missing Step',
      objective: 'Restore the missing mask operation so contours can resolve.',
      shortGoal: 'Assign the missing mask operation.',
      helperHint: 'Mask operation missing.',
      successConditions: [
        'Assign a valid mask operation.',
        'Allow contours to resolve from the mask.',
      ],
      failureConditions: ['Mask operation missing.', 'Contours not found.'],
      lessonNudgeDelaySeconds: 25,
      lessonNudgeMessage:
        'This mission teaches why contour finding needs a clean mask first. If the stack still feels opaque, open the lesson and come back with that one goal in mind.',
      sceneSeed: 1041,
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          null,
          ['binary_threshold', 'high_pass_mask'],
          false,
          {
            level: 166,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 120,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 2,
        }),
        step(
          'step-mask',
          'mask',
          ['blurred'],
          'binary_threshold',
          ['binary_threshold', 'high_pass_mask'],
          false,
          {
            level: 166,
          },
        ),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 120,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      relatedLesson: lessonIntro,
    },
    {
      id: 'wrong-order',
      missionSetId: 'building-a-pipeline',
      levelNumber: 2,
      title: 'Wrong Order',
      objective: 'Reorder the pipeline so each stage receives the right input at the right time.',
      shortGoal: 'Move the blur stage before mask and contour extraction.',
      helperHint: 'Operation order matters.',
      successConditions: [
        'Blur feeds the mask before contour extraction runs.',
        'The pipeline order stabilizes downstream inputs.',
      ],
      failureConditions: ['Wrong operation order.', 'Downstream steps wait on invalid inputs.'],
      lessonNudgeDelaySeconds: 18,
      lessonNudgeMessage:
        'This mission is about pipeline order, not guesswork. Check what each line consumes and produces, then use the lesson to reinforce why sequence changes the result.',
      sceneSeed: 1075,
      sceneOptions: {
        targetCode: 'HX-19',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 166,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 2,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 118,
        }),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      relatedLesson: {
        ...lessonNeural,
        lessonTitle: 'Image Classification Pipeline',
        relevance:
          'This level is about sequencing the pipeline correctly. The lecture helps explain why vision models need ordered feature extraction instead of raw pixels or shuffled stages.',
        timing: 'during',
      },
    },
    {
      id: 'edge-filter',
      missionSetId: 'feature-extraction',
      levelNumber: 1,
      title: 'Edge Filter',
      objective: 'Choose the edge operator that exposes the target boundary cleanly.',
      shortGoal: 'Switch to a cleaner edge detector.',
      helperHint: 'Different filters preserve different structure.',
      successConditions: [
        'The target boundary survives edge extraction.',
        'The final selector receives a cleaner feature map.',
      ],
      failureConditions: ['Edges are too fragmented.', 'Target selection unstable.'],
      lessonNudgeDelaySeconds: 22,
      lessonNudgeMessage:
        'This mission is about how filters change the features that survive. The lecture can help connect that to learned CNN filters.',
      sceneSeed: 1101,
      sceneOptions: {
        targetCode: 'HX-22',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], true, {
          level: 166,
        }),
        step(
          'step-edges',
          'edges',
          ['blurred'],
          'laplacian_edges',
          ['sobel_edges', 'canny_edges', 'laplacian_edges'],
          false,
          {
            sensitivity: 164,
          },
        ),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], true, {
          level: 166,
        }),
        step(
          'step-edges',
          'edges',
          ['blurred'],
          'canny_edges',
          ['sobel_edges', 'canny_edges', 'laplacian_edges'],
          false,
          {
            sensitivity: 118,
          },
        ),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ], true),
      ]),
      relatedLesson: lessonCnn,
    },
    {
      id: 'bad-parameters',
      missionSetId: 'feature-extraction',
      levelNumber: 2,
      title: 'Bad Parameters',
      objective: 'Tune blur, threshold, and edge sensitivity until the target contour stabilizes.',
      shortGoal: 'Fix the threshold and edge response.',
      helperHint: 'Good structure still fails with bad values.',
      successConditions: [
        'Edge response becomes stable.',
        'Threshold and blur preserve the target contour.',
      ],
      failureConditions: ['Edges too fragmented.', 'Noise still dominating the mask.'],
      lessonNudgeDelaySeconds: 24,
      lessonNudgeMessage:
        'The stack is structurally correct here. The lesson can help connect threshold and edge sensitivity to cleaner feature separation.',
      sceneSeed: 1113,
      sceneOptions: {
        targetCode: 'HX-23',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 5,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 208,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 210,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold'], false, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], false, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'best_contour',
        ]),
      ]),
      relatedLesson: {
        ...lessonCnn,
        lessonTitle: 'Image Features and Recognition',
        relevance:
          'This level is about parameter sensitivity. The lecture helps connect thresholding and edge response to how features become more or less separable.',
        timing: 'during',
      },
    },
    {
      id: 'false-target',
      missionSetId: 'finding-objects',
      levelNumber: 4,
      title: 'False Target Elimination',
      objective: 'Reject the distractor and promote the real target contour.',
      shortGoal: 'Choose the selector that rejects the distractor.',
      helperHint: 'Pick the best contour, not the largest contour.',
      successConditions: [
        'The selector rejects the distractor.',
        'The intended target contour is chosen.',
      ],
      failureConditions: ['Wrong contour selected.', 'Target selection unstable.'],
      lessonNudgeDelaySeconds: 24,
      lessonNudgeMessage:
        'This mission teaches target selection. Use the lesson as theory support if the machine keeps locking onto the biggest distractor.',
      sceneSeed: 1169,
      sceneOptions: {
        variant: 'false-target',
        targetCode: 'HX-31',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', [
          'binary_threshold',
        ], true, {
          level: 162,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], null, [
          'largest_contour',
          'best_contour',
        ]),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale'], true),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], true, {
          radius: 2,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', [
          'binary_threshold',
        ], true, {
          level: 162,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['canny_edges'], true, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours'], true),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'largest_contour',
          'best_contour',
        ]),
      ]),
      relatedLesson: {
        ...lessonDetection,
        lessonTitle: 'Training Linear Classifiers',
        relevance:
          'This level is about rejecting the wrong candidate. The lecture helps frame why choosing the best feature match beats using a naive largest-object rule.',
      },
    },
    {
      id: 'full-debug',
      missionSetId: 'finding-objects',
      levelNumber: 5,
      title: 'Full Debug Mission',
      objective: 'Repair the full multi-stage stack and restore a stable contour lock.',
      shortGoal: 'Find the breaking step and rebuild the contour lock.',
      helperHint: 'Multiple weak points are destabilizing the lock.',
      successConditions: [
        'False positives are reduced.',
        'The full stack returns to a stable contour lock.',
      ],
      failureConditions: ['Noise still dominating the mask.', 'Wrong contour selected.'],
      lessonNudgeDelaySeconds: 30,
      lessonNudgeMessage:
        'This is the full debug pass. If the whole stack feels noisy, step back and use the lesson as a theory reset before rebuilding the pipeline one stage at a time.',
      sceneSeed: 1227,
      sceneOptions: {
        variant: 'crowded',
        targetCode: 'HX-37',
      },
      initialProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-mask', 'mask', ['blurred'], null, ['binary_threshold', 'high_pass_mask'], false, {
          level: 176,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 4,
        }),
        step('step-edges', 'edges', ['blurred'], 'sobel_edges', ['sobel_edges', 'canny_edges'], false, {
          sensitivity: 188,
        }),
        step('step-target', 'target', ['contours', 'edges'], 'largest_contour', [
          'largest_contour',
          'best_contour',
        ]),
      ]),
      solutionProgram: createProgram([
        step('step-input', 'frame', [], 'input_image', ['input_image'], true),
        step('step-mono', 'mono', ['frame'], 'to_grayscale', ['to_grayscale']),
        step('step-blur', 'blurred', ['mono'], 'gaussian_blur', ['gaussian_blur'], false, {
          radius: 3,
        }),
        step('step-mask', 'mask', ['blurred'], 'binary_threshold', ['binary_threshold', 'high_pass_mask'], false, {
          level: 166,
        }),
        step('step-edges', 'edges', ['blurred'], 'canny_edges', ['sobel_edges', 'canny_edges'], false, {
          sensitivity: 118,
        }),
        step('step-contours', 'contours', ['mask'], 'find_contours', ['find_contours']),
        step('step-target', 'target', ['contours', 'edges'], 'best_contour', [
          'largest_contour',
          'best_contour',
        ]),
      ]),
      relatedLesson: {
        ...lessonDetection,
        lessonTitle: 'Neural Networks Part 1',
        relevance:
          'This mission is a full debugging pass. The lecture helps connect layered processing decisions to the idea of building progressively more useful representations.',
      },
    },
  ] satisfies FindShapeLevelConfig[],
}

function step(
  id: string,
  outputVar: string,
  inputVars: string[],
  functionId: FindShapeOperationId | null,
  functionOptions: FindShapeOperationId[],
  locked = false,
  parameterValues?: Record<string, number | null>,
) {
  return createStep({
    id,
    outputVar,
    inputVars,
    functionId,
    functionOptions,
    locked,
    parameterValues,
  })
}

function createProgram(steps: FindShapeProgram['steps']): FindShapeProgram {
  return {
    steps,
    display: {
      showMask: true,
      showContours: true,
      showOverlay: true,
    },
  }
}
