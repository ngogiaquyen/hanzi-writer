export const translateChineseToVietnamese = async (chinese: string) => {
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(chinese)}`,
  );
  if (!response.ok) throw new Error('Không thể dịch từ tiếng Trung');

  const data = (await response.json()) as unknown[][];
  const firstSegment = data[0];
  const firstTranslation = Array.isArray(firstSegment) ? firstSegment[0] : null;

  if (Array.isArray(firstTranslation) && typeof firstTranslation[0] === 'string') {
    return firstTranslation[0].trim();
  }

  return '';
};