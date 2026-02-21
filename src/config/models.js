export const MODELS = [
  {
    id: 'rfdetr-nano',
    name: 'RF-DETR Nano',
    file: 'rfdetr-nano-fp16.onnx',
    family: 'rfdetr',
    task: 'detect',
    resolution: [384, 384],
    inputName: 'input',
    license: 'Apache-2.0',
  },
  {
    id: 'rfdetr-seg-nano',
    name: 'RF-DETR Seg Nano',
    file: 'rfdetr-seg-nano-fp16.onnx',
    family: 'rfdetr',
    task: 'seg',
    resolution: [312, 312],
    inputName: 'input',
    license: 'Apache-2.0',
  },
  {
    id: 'depth-anything-v2-vits',
    name: 'Depth Anything V2',
    file: 'depth-anything-v2-vits-fp16.onnx',
    family: 'depth-anything',
    task: 'depth',
    resolution: [518, 518],
    inputName: 'image',
    license: 'Apache-2.0',
  },
];

export const DEFAULT_MODEL_ID = 'rfdetr-seg-nano';

export function getModelById(id) {
  return MODELS.find((m) => m.id === id);
}

export function getModelsByTask(task) {
  return MODELS.filter((m) => m.task === task);
}
