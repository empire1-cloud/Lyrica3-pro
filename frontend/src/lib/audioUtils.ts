/**
 * audioUtils — PCM/WAV conversion utilities for Lyrica3 Pro audio pipeline
 */

/**
 * Convert base64-encoded PCM audio data to a playable WAV blob URL.
 * @param base64Audio - base64 string of raw PCM audio (16-bit, 24kHz, mono)
 * @returns object URL pointing to a WAV blob
 */
export function pcmToWav(base64Audio: string): string {
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const pcmData = bytes;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.byteLength, true);

  const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
  return URL.createObjectURL(wavBlob);
}
