/**
 * ANN Priority Module
 * 
 * This module estimates urgency/priority for traffic requests using
 * a Multi-Layer Perceptron (MLP) neural network implementation.
 * 
 * The module provides:
 * - Binary classification (urgent vs non-urgent)
 * - Multi-class priority prediction (low, normal, high, critical)
 * - Confidence scores for predictions
 * 
 * Network Architecture:
 * - Input Layer: 6 features
 * - Hidden Layer 1: 8 neurons (ReLU activation)
 * - Hidden Layer 2: 4 neurons (ReLU activation)
 * - Output Layer: 4 neurons (Softmax for multi-class)
 */

import { ProcessedRequest, PriorityLevel, ANNPrediction } from "../types";

// ============================================================================
// NEURAL NETWORK TYPES
// ============================================================================

interface NeuralNetwork {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  weights: number[][][];
  biases: number[][];
}

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

/**
 * ReLU activation function.
 * Returns max(0, x) for each input.
 */
function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Sigmoid activation function.
 * Used for binary classification output.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

/**
 * Softmax activation function.
 * Converts raw scores to probability distribution.
 */
function softmax(values: number[]): number[] {
  const maxVal = Math.max(...values);
  const expValues = values.map((v) => Math.exp(v - maxVal));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map((v) => v / sumExp);
}

// ============================================================================
// PRE-TRAINED WEIGHTS (Simplified for demonstration)
// ============================================================================

/**
 * Pre-trained weights for the neural network.
 * These weights are manually tuned to demonstrate the expected behavior:
 * - Emergency vehicles with high severity → Critical priority
 * - Emergency vehicles with time sensitivity → High priority
 * - Civilian vehicles → Normal/Low priority
 */
const pretrainedWeights: number[][][] = [
  // Input (6) → Hidden1 (8)
  [
    [0.8, -0.2, 0.5, 0.3, 0.4, 0.6, -0.1, 0.7],   // vehicle type
    [0.6, 0.4, 0.7, 0.5, 0.3, 0.2, 0.8, 0.4],    // request type
    [0.9, 0.7, 0.8, 0.6, 0.5, 0.4, 0.9, 0.8],    // severity
    [0.7, 0.5, 0.6, 0.4, 0.8, 0.7, 0.5, 0.6],    // time sensitivity
    [0.4, 0.3, 0.5, 0.2, 0.3, 0.4, 0.2, 0.3],    // traffic density
    [0.3, 0.2, 0.4, 0.3, 0.2, 0.3, 0.1, 0.2],    // distance
  ],
  // Hidden1 (8) → Hidden2 (4)
  [
    [0.6, 0.4, 0.3, 0.5],
    [0.5, 0.6, 0.4, 0.3],
    [0.7, 0.5, 0.6, 0.4],
    [0.4, 0.3, 0.5, 0.6],
    [0.5, 0.4, 0.4, 0.5],
    [0.3, 0.5, 0.3, 0.4],
    [0.6, 0.4, 0.5, 0.3],
    [0.4, 0.6, 0.4, 0.5],
  ],
  // Hidden2 (4) → Output (4)
  [
    [-0.5, 0.2, 0.4, 0.9],   // Low priority path
    [0.2, 0.6, 0.3, 0.1],    // Normal priority path
    [0.3, 0.4, 0.7, 0.2],    // High priority path
    [0.8, 0.3, 0.2, -0.3],   // Critical priority path
  ],
];

const pretrainedBiases: number[][] = [
  [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],  // Hidden1 biases
  [0.1, 0.1, 0.1, 0.1],                       // Hidden2 biases
  [-0.2, 0.0, 0.1, 0.3],                      // Output biases
];

// ============================================================================
// NEURAL NETWORK IMPLEMENTATION
// ============================================================================

/**
 * Creates a neural network with pre-trained weights.
 */
function createNetwork(): NeuralNetwork {
  return {
    inputSize: 6,
    hiddenLayers: [8, 4],
    outputSize: 4,
    weights: pretrainedWeights,
    biases: pretrainedBiases,
  };
}

/**
 * Forward propagation through the network.
 * Computes the output given an input vector.
 */
function forward(network: NeuralNetwork, input: number[]): number[] {
  let current = input;

  // Process through each layer
  for (let layer = 0; layer < network.weights.length; layer++) {
    const weights = network.weights[layer];
    const biases = network.biases[layer];
    const isOutputLayer = layer === network.weights.length - 1;

    // Calculate next layer activations
    const nextSize = weights[0].length;
    const next: number[] = new Array(nextSize).fill(0);

    for (let j = 0; j < nextSize; j++) {
      let sum = biases[j];
      for (let i = 0; i < current.length; i++) {
        sum += current[i] * weights[i][j];
      }
      
      // Apply activation function
      if (isOutputLayer) {
        next[j] = sum; // Raw scores for softmax
      } else {
        next[j] = relu(sum);
      }
    }

    current = next;
  }

  return current;
}

/**
 * Binary classifier for urgent vs non-urgent.
 * Uses a threshold on the urgency score.
 */
function binaryClassify(urgencyScore: number): "urgent" | "non-urgent" {
  return urgencyScore >= 0.5 ? "urgent" : "non-urgent";
}

/**
 * Converts output probabilities to priority level.
 */
function getPriorityFromOutput(probabilities: number[]): {
  priority: PriorityLevel;
  confidence: number;
} {
  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const priorities: PriorityLevel[] = [
    PriorityLevel.LOW,
    PriorityLevel.NORMAL,
    PriorityLevel.HIGH,
    PriorityLevel.CRITICAL,
  ];

  return {
    priority: priorities[maxIndex],
    confidence: probabilities[maxIndex],
  };
}

// ============================================================================
// MAIN PREDICTION FUNCTIONS
// ============================================================================

/**
 * Predicts the priority level for a processed traffic request.
 * 
 * @param request - The preprocessed traffic request with feature vector
 * @returns ANNPrediction - The predicted priority with confidence scores
 */
export function predictPriority(request: ProcessedRequest): ANNPrediction {
  // Validate feature vector
  if (!request.featureVector || request.featureVector.length !== 6) {
    // Return default prediction for invalid input
    return {
      predictedPriority: PriorityLevel.NORMAL,
      confidence: 0.0,
      urgencyScore: 0.0,
      binaryClassification: "non-urgent",
    };
  }

  // Create network and run forward propagation
  const network = createNetwork();
  const rawOutput = forward(network, request.featureVector);
  const probabilities = softmax(rawOutput);

  // Get priority prediction
  const { priority, confidence } = getPriorityFromOutput(probabilities);

  // Calculate urgency score (weighted sum of high and critical probabilities)
  const urgencyScore = probabilities[2] * 0.3 + probabilities[3] * 0.7;

  return {
    predictedPriority: priority,
    confidence: Math.round(confidence * 100) / 100,
    urgencyScore: Math.round(urgencyScore * 100) / 100,
    binaryClassification: binaryClassify(urgencyScore),
  };
}

/**
 * Enhanced prediction with rule-based adjustments.
 * Combines neural network output with domain-specific rules.
 */
export function predictPriorityEnhanced(request: ProcessedRequest): ANNPrediction {
  // Get base prediction from neural network
  const basePrediction = predictPriority(request);

  // Apply domain-specific rules for adjustment
  let adjustedPriority = basePrediction.predictedPriority;
  let adjustedConfidence = basePrediction.confidence;
  let adjustedUrgency = basePrediction.urgencyScore;

  // Rule: Emergency vehicles with high/critical severity → Critical priority
  const isEmergency = request.normalizedData.vehicleTypeCode >= 2;
  const isHighSeverity = request.normalizedData.severityCode >= 2;
  const isTimeSensitive = request.normalizedData.timeSensitivityCode === 1;

  if (isEmergency && isHighSeverity) {
    adjustedPriority = PriorityLevel.CRITICAL;
    adjustedConfidence = Math.max(adjustedConfidence, 0.9);
    adjustedUrgency = Math.max(adjustedUrgency, 0.85);
  } else if (isEmergency && isTimeSensitive) {
    if (adjustedPriority === PriorityLevel.LOW || adjustedPriority === PriorityLevel.NORMAL) {
      adjustedPriority = PriorityLevel.HIGH;
      adjustedConfidence = Math.max(adjustedConfidence, 0.75);
      adjustedUrgency = Math.max(adjustedUrgency, 0.6);
    }
  }

  // Rule: Non-emergency vehicles cap at Normal priority (unless explicit claim)
  if (!isEmergency && !request.priorityClaim) {
    if (adjustedPriority === PriorityLevel.HIGH || adjustedPriority === PriorityLevel.CRITICAL) {
      adjustedPriority = PriorityLevel.NORMAL;
    }
    adjustedUrgency = Math.min(adjustedUrgency, 0.4);
  }

  return {
    predictedPriority: adjustedPriority,
    confidence: Math.round(adjustedConfidence * 100) / 100,
    urgencyScore: Math.round(adjustedUrgency * 100) / 100,
    binaryClassification: binaryClassify(adjustedUrgency),
  };
}

/**
 * Batch prediction for multiple requests.
 */
export function predictPriorityBatch(requests: ProcessedRequest[]): ANNPrediction[] {
  return requests.map((req) => predictPriorityEnhanced(req));
}

/**
 * Gets the network architecture details for visualization.
 */
export function getNetworkArchitecture(): {
  layers: { name: string; size: number; activation: string }[];
} {
  return {
    layers: [
      { name: "Input Layer", size: 6, activation: "none" },
      { name: "Hidden Layer 1", size: 8, activation: "ReLU" },
      { name: "Hidden Layer 2", size: 4, activation: "ReLU" },
      { name: "Output Layer", size: 4, activation: "Softmax" },
    ],
  };
}

/**
 * Explains the features used for prediction.
 */
export function getFeatureExplanation(): {
  feature: string;
  description: string;
  range: string;
}[] {
  return [
    { feature: "Vehicle Type", description: "Type of vehicle making the request", range: "0-3 (Civilian to Emergency)" },
    { feature: "Request Type", description: "Category of the traffic request", range: "0-4 (Route to Integrated)" },
    { feature: "Incident Severity", description: "Severity level of the incident", range: "0-3 (Low to Critical)" },
    { feature: "Time Sensitivity", description: "Whether the request is time-sensitive", range: "0-1 (No/Yes)" },
    { feature: "Traffic Density", description: "Current traffic conditions", range: "0-3 (Low to Congested)" },
    { feature: "Estimated Distance", description: "Normalized distance to destination", range: "0-1" },
  ];
}
