function normalize(text) {
  return text.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const TOPICS = [
  { id: "probation", search: "probationary regularization 296", pattern: /\b(probation(?:ary)?|regularization|regularisasyon|probasyon)\b/ },
  { id: "deductions", search: "wage deductions 113", pattern: /\b(wage deductions?|salary deductions?|deduct(?:ion|ions)?|cash bond|kaltas|bawas sa (?:sahod|sweldo))\b/ },
  { id: "hours", search: "overtime working hours 87", pattern: /\b(overtime|working hours|hours of work|rest day|meal break|oras ng trabaho|dagdag na oras)\b/ },
  { id: "termination", search: "termination dismissal 297 298", pattern: /\b(termination|dismissal|retrenchment|redundancy|tanggal sa trabaho|pagtanggal|tinanggal|pagkatanggal)\b/ },
  { id: "non_compete", search: "non compete restrictive covenant", pattern: /\b(non compete|restrictive covenant|restraint of trade)\b/ },
  { id: "pay", search: "13th month pay minimum wage", pattern: /\b(13th month|thirteenth month|minimum wage|sahod|sweldo)\b/ },
];
const OUTSIDE_SCOPE = /\b(weather|forecast|recipe|cook(?:ing)?|basketball|football|movie|anime|pokemon|game|baseball|hockey|soccer|tennis|volleyball|school|academic|criminal probation|bitcoin|crypto|horoscope|astrology|election|president|python|javascript|html|essay|poem|song|joke|sunog|campfire|firewall|youtube|facebook|instagram|tiktok|google drive|dropbox|ignore (?:all |previous )?instructions)\b/;
function legalTopics(text) {
  const normalized = normalize(text);
  return TOPICS.filter((topic) => topic.pattern.test(normalized));
}
function classifyQuestion(message) {
  const text = normalize(message);
  if (OUTSIDE_SCOPE.test(text)) return { kind: "out_of_scope" };
  const quickActions = {
    "platform walkthrough": "platform_tutorial",
    "track review status": "track_status_pipeline",
    "data privacy ra 10173": "privacy_and_pii",
    "data privacy": "privacy_and_pii",
  };
  if (Object.hasOwn(quickActions, text)) return { kind: "platform", topic: quickActions[text] };
  const platform = /\b(lingkod batas|platform|portal|sidebar|this (?:system|app|site))\b/.test(text);
  const contract = /\b(contract|contracts|kontrata|employment document|legal document)\b/.test(text);
  const short = /^(?:(?:how to|paano|paano mag|paano ko|how do i) )?(upload|submit|track|view report|download report|get started|use lingkod batas)$/.test(text);
  if ((platform || contract || short) && /\b(upload|submit|attach|mag upload|ipasa|isumite)\b/.test(text)) return { kind: "platform", topic: "upload_and_submit" };
  if ((platform || contract || short) && /\b(track|status|progress|subaybayan)\b/.test(text)) return { kind: "platform", topic: "track_status_pipeline" };
  if ((platform || contract || /\b(?:view|download|tingnan|i download) (?:my |ang )?(?:compliance )?report\b/.test(text)) && /\b(report|results)\b/.test(text)) return { kind: "platform", topic: "view_and_download_report" };
  if (platform && /\b(privacy|security|pii|confidential|data)\b/.test(text)) return { kind: "platform", topic: "privacy_and_pii" };
  if ((platform || contract) && /\b(attorney|lawyer|abogado|who reviews|sino.*review)\b/.test(text)) return { kind: "platform", topic: "attorney_review_role" };
  if ((platform || contract) && /\b(supported|types?|uri)\b/.test(text)) return { kind: "platform", topic: "supported_contracts" };
  if (platform && /\b(tutorial|walkthrough|guide|use|start|getting started|paano|how)\b/.test(text)) return { kind: "platform", topic: "platform_tutorial" };
  if (platform && /\b(features|overview|what is|about|capabilities|ano)\b/.test(text)) return { kind: "platform", topic: "platform_overview_features" };
  const topics = legalTopics(message);
  return topics.length ? { kind: "legal", topics } : { kind: "out_of_scope" };
}
module.exports = { classifyQuestion, legalTopics };

function questionRequirements(message) {
  const text = normalize(message);
  const checks = [
    { id: "holiday", question: /\b(holidays?|pista opisyal)\b/, source: /\b(holidays?|pista opisyal)\b/i },
    { id: "rest_day", question: /\b(rest days?|sundays?)\b/, source: /\b(rest days?|sundays?)\b/i },
    { id: "night_shift", question: /\b(night shift|gabi)\b/, source: /\b(night shift|night differential|gabi)\b/i },
    { id: "resignation", question: /\b(resign\w*|magresign)\b/, source: /\b(resign\w*)\b/i },
    { id: "duration", question: /\b(how long|duration|gaano katagal|ilang (?:araw|buwan|taon)|maximum period)\b/, source: /\b(\d+|six|eight|thirty|anim)\b[\s\S]{0,40}\b(days?|months?|years?|araw|buwan|taon)\b/i },
    { id: "exceptions", question: /\b(except\w*|exempt\w*|not covered|hindi sakop)\b/, source: /\b(except\w*|exempt\w*|not covered|excluded|does not apply|hindi sakop)\b/i },
    { id: "rate", question: /\b(how much|magkano|percentage|rate|porsyento)\b/, source: /(?:\d+\s*%|percent|per cent|pesos|PHP|rate of)/i },
    { id: "calculation", question: /\b(calculat\w*|comput\w*|kalkul\w*)\b/, source: /\b(calculat\w*|comput\w*|formula|divid\w*|multipl\w*|one twelfth)\b/i },
    { id: "procedure", question: /\b(procedure|steps|process for|proseso|paano mag)\b/, source: /\b(notice|procedure|steps|process|filed|filing|written|hearing)\b/i },
  ];
  return checks.filter((check) => check.question.test(text));
}
module.exports.questionRequirements = questionRequirements;
