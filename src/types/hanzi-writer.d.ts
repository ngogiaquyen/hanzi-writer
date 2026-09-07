declare module 'hanzi-writer' {
  export interface HanziWriterOptions {
    width?: number;
    height?: number;
    padding?: number;
    showOutline?: boolean;
    strokeAnimationSpeed?: number;
    delayBetweenStrokes?: number;
    strokeColor?: string;
    radicalColor?: string;
    highlightColor?: string;
    outlineColor?: string;
    drawingColor?: string;
    drawingWidth?: number;
    showCharacter?: boolean;
    showHintAfterMisses?: number;
    highlightOnComplete?: boolean;
    highlightCompleteColor?: string;
    strokeFadeDuration?: number;
    charDataLoader?: (char: string, onLoad: (data: any) => void, onError: (err: any) => void) => void;
  }

  export default class HanziWriter {
    static create(element: HTMLElement | string, character: string, options?: HanziWriterOptions): HanziWriter;
    static loadCharacterData(character: string, options?: any): Promise<any>;
    static getScalingTransform(width: number, height: number, padding?: number): any;

    animateCharacter(options?: { onComplete?: () => void }): void;
    animateStroke(strokeNum: number, options?: { onComplete?: () => void }): void;
    loopCharacterAnimation(): void;
    pauseAnimation(): void;
    resumeAnimation(): void;
    hideCharacter(): void;
    showCharacter(): void;
    hideOutline(): void;
    showOutline(): void;
    updateColor(colorName: string, colorVal: string, options?: { duration?: number }): void;
    quiz(options?: {
      onMistake?: (strokeData: any) => void;
      onCorrectStroke?: (strokeData: any) => void;
      onComplete?: (summaryData: any) => void;
    }): void;
    cancelQuiz(): void;
    setCharacter(character: string): void;
  }
}
