import type { FindShapeOperationId } from './types'

export interface OperationHelpEntry {
  title: string
  summary: string
  effect: string
  lectureBridge: string
}

export const findShapeOperationHelp: Record<FindShapeOperationId, OperationHelpEntry> = {
  input_image: {
    title: 'Input Image',
    summary: 'Feeds the raw scan into the pipeline.',
    effect: 'Everything downstream depends on this frame.',
    lectureBridge: 'CS231n starts from raw pixels before any learned or hand-built features exist.',
  },
  to_grayscale: {
    title: 'To Grayscale',
    summary: 'Converts the scan to a single luminance channel.',
    effect: 'Simplifies the signal before thresholding or edges.',
    lectureBridge: 'Feature extraction often starts by removing color distractions.',
  },
  extract_luma: {
    title: 'Extract Luma',
    summary: 'Uses brightness as the main signal.',
    effect: 'Helps when the target is best separated by lightness.',
    lectureBridge: 'Useful when intensity carries more structure than chroma.',
  },
  max_channel: {
    title: 'Max Channel',
    summary: 'Takes the strongest color channel at each pixel.',
    effect: 'Can keep noise and false highlights alive.',
    lectureBridge: 'A noisy feature map makes later decisions less reliable.',
  },
  gaussian_blur: {
    title: 'Gaussian Blur',
    summary: 'Smooths tiny variations before feature extraction.',
    effect: 'Reduces speckle noise but can soften boundaries.',
    lectureBridge: 'Preprocessing changes which features survive into later stages.',
  },
  box_blur: {
    title: 'Box Blur',
    summary: 'A simpler average blur.',
    effect: 'Flattens noise quickly but can smear edges.',
    lectureBridge: 'Different filters preserve different structure.',
  },
  median_blur: {
    title: 'Median Blur',
    summary: 'Suppresses isolated outliers.',
    effect: 'Good for salt-and-pepper noise before masking.',
    lectureBridge: 'Choosing the right preprocessing changes the feature distribution.',
  },
  binary_threshold: {
    title: 'Binary Threshold',
    summary: 'Turns the image into a clean foreground mask.',
    effect: 'Too high removes the target, too low keeps noise.',
    lectureBridge: 'This is a direct signal-vs-noise decision boundary.',
  },
  high_pass_mask: {
    title: 'High-Pass Mask',
    summary: 'Keeps only the brightest structures.',
    effect: 'Rejects dim clutter but can cut into the target.',
    lectureBridge: 'Aggressive filtering can improve precision at the cost of recall.',
  },
  adaptive_cutoff: {
    title: 'Adaptive Cutoff',
    summary: 'Thresholds based on local neighborhoods.',
    effect: 'Handles uneven lighting better than one global cutoff.',
    lectureBridge: 'Local context can rescue features when global rules fail.',
  },
  sobel_edges: {
    title: 'Sobel Edges',
    summary: 'Measures gradient strength to trace boundaries.',
    effect: 'Finds broad edge structure but can keep extra noise.',
    lectureBridge: 'Edges are one of the classic hand-crafted features.',
  },
  canny_edges: {
    title: 'Canny Edges',
    summary: 'Produces a cleaner edge map with stronger pruning.',
    effect: 'Better for crisp boundaries when sensitivity is tuned well.',
    lectureBridge: 'A cleaner feature map makes contour selection easier.',
  },
  laplacian_edges: {
    title: 'Laplacian Edges',
    summary: 'Highlights rapid intensity changes.',
    effect: 'Sensitive to noise but useful for sharp transitions.',
    lectureBridge: 'Different edge operators emphasize different structure.',
  },
  find_contours: {
    title: 'Find Contours',
    summary: 'Traces connected mask regions into candidate shapes.',
    effect: 'Needs a stable binary mask to return meaningful candidates.',
    lectureBridge: 'Segmentation quality controls downstream object proposals.',
  },
  trace_regions: {
    title: 'Trace Regions',
    summary: 'Alternative region tracing for connected components.',
    effect: 'Changes how candidate boundaries are assembled.',
    lectureBridge: 'Representation choice affects later scoring and selection.',
  },
  best_contour: {
    title: 'Best Contour',
    summary: 'Chooses the contour that best matches the target signal.',
    effect: 'Balances coverage, purity, and edge support.',
    lectureBridge: 'Good features matter because the final selector must choose the right hypothesis.',
  },
  largest_contour: {
    title: 'Largest Contour',
    summary: 'Picks the biggest candidate region.',
    effect: 'Fast, but often wrong when distractors are larger.',
    lectureBridge: 'A naive heuristic can fail even when features are present.',
  },
  cleanest_contour: {
    title: 'Cleanest Contour',
    summary: 'Prioritizes sharp boundaries and purity.',
    effect: 'Useful when edge quality matters more than size.',
    lectureBridge: 'Different scoring rules encode different assumptions about the target.',
  },
}
