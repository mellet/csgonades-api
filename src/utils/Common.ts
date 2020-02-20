import { ErrorFactory } from "./ErrorUtil";

export const removeUndefines = <T extends Object>(object: T): T => {
  const newObject = {
    ...object
  };
  Object.keys(newObject).forEach(
    key => newObject[key] === undefined && delete newObject[key]
  );
  return newObject;
};

export function extractGfyIdFromIdOrUrl(gfycatIdOrUrl: string): string {
  const index = gfycatIdOrUrl.lastIndexOf("/");
  const gfyId = gfycatIdOrUrl.substr(index + 1);
  return gfyId;
}

export function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num;
}

export function assertNever(never: never) {
  return ErrorFactory.InternalServerError(`Did not expect to reach this code.`);
  // no-op
}

export const nicknameCleaner = (nickname?: string, realname?: string) => {
  const cleanNickname = nickname?.replace(/[^A-Za-z0-9]/g, "");
  const cleanRealname = realname?.replace(/[^A-Za-z0-9]/g, "");
  const cleanTransliterate = nickname ? transliterate(nickname) : "";

  if (cleanNickname && cleanNickname.length) {
    return cleanNickname;
  } else if (cleanRealname && cleanRealname.length) {
    return cleanRealname;
  } else if (cleanTransliterate && cleanTransliterate.length) {
    return cleanTransliterate;
  } else {
    return "Unknown nickname";
  }
};

export function transliterate(word: string) {
  const A = {};
  let result = "";

  A["Ё"] = "YO";
  A["Й"] = "I";
  A["Ц"] = "TS";
  A["У"] = "U";
  A["К"] = "K";
  A["Е"] = "E";
  A["Н"] = "N";
  A["Г"] = "G";
  A["Ш"] = "SH";
  A["Щ"] = "SCH";
  A["З"] = "Z";
  A["Х"] = "H";
  A["Ъ"] = "'";
  A["ё"] = "yo";
  A["й"] = "i";
  A["ц"] = "ts";
  A["у"] = "u";
  A["к"] = "k";
  A["е"] = "e";
  A["н"] = "n";
  A["г"] = "g";
  A["ш"] = "sh";
  A["щ"] = "sch";
  A["з"] = "z";
  A["х"] = "h";
  A["ъ"] = "'";
  A["Ф"] = "F";
  A["Ы"] = "I";
  A["В"] = "V";
  A["А"] = "A";
  A["П"] = "P";
  A["Р"] = "R";
  A["О"] = "O";
  A["Л"] = "L";
  A["Д"] = "D";
  A["Ж"] = "ZH";
  A["Э"] = "E";
  A["ф"] = "f";
  A["ы"] = "i";
  A["в"] = "v";
  A["а"] = "a";
  A["п"] = "p";
  A["р"] = "r";
  A["о"] = "o";
  A["л"] = "l";
  A["д"] = "d";
  A["ж"] = "zh";
  A["э"] = "e";
  A["Я"] = "YA";
  A["Ч"] = "CH";
  A["С"] = "S";
  A["М"] = "M";
  A["И"] = "I";
  A["Т"] = "T";
  A["Ь"] = "'";
  A["Б"] = "B";
  A["Ю"] = "YU";
  A["я"] = "ya";
  A["ч"] = "ch";
  A["с"] = "s";
  A["м"] = "m";
  A["и"] = "i";
  A["т"] = "t";
  A["ь"] = "'";
  A["б"] = "b";
  A["ю"] = "yu";

  for (var i = 0; i < word.length; i++) {
    const c = word.charAt(i);
    result += A[c] || c;
  }

  return result;
}
