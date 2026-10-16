import { categories, labs, type Lab } from '@/content/labs';
import { categoriesVi, labTranslationsVi } from '@/content/labs.vi';
import type { Locale } from '@/lib/locale';

/** Preserve the executable lab definition while translating its displayed text. */
export function localizeLab(lab: Lab, locale: Locale): Lab {
  if (locale === 'en') return lab;
  const translation = labTranslationsVi[lab.id];
  if (!translation) return lab;
  const { validationExplanations, incidentObservations, ...text } = translation;
  return {
    ...lab,
    ...text,
    validationRules: lab.validationRules.map((rule, index) => ({
      ...rule,
      explanation: validationExplanations[index] ?? rule.explanation,
    })),
    ...(lab.incidentQueries && {
      incidentQueries: lab.incidentQueries.map((query, index) => ({
        ...query,
        observation: incidentObservations?.[index] ?? query.observation,
      })),
    }),
  };
}

export function localizedLabs(locale: Locale): Lab[] {
  return locale === 'en' ? labs : labs.map((lab) => localizeLab(lab, locale));
}

export function localizedCategories(locale: Locale): typeof categories {
  return locale === 'en'
    ? categories
    : categories.map((category) => ({ ...category, ...categoriesVi[category.id] }));
}
