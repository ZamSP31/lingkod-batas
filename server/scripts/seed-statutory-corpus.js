/**
 * seed-statutory-corpus.js
 * Seeds the foundational Philippine Labor Law Corpus into MongoDB Atlas.
 *
 * Grounded in:
 * - Labor Code of the Philippines (PD 442, renumbered per DOLE DA 01-15)
 * - DOLE Department Orders (DO 147-15, DO 174-17)
 * - Civil Code Article 1306 (Post-employment restrictive covenants)
 * - Presidential Decree No. 851 (13th Month Pay)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const StatutorySource = require("../src/models/StatutorySource");

const SEED_DATA = [
  {
    citation: "Labor Code of the Philippines, Article 297 [formerly Art. 282]",
    title: "Termination by Employer (Just Causes)",
    sourceType: "labor_code",
    provisionNumber: "Art. 297",
    provisionText:
      "An employer may terminate an employment for any of the following causes: (a) Serious misconduct or willful disobedience by the employee of the lawful orders of his employer or representative in connection with his work; (b) Gross and habitual neglect by the employee of his duties; (c) Fraud or willful breach by the employee of the trust reposed in him by his employer or duly authorized representative; (d) Commission of a crime or offense by the employee against the person of his employer or any immediate member of his family or his duly authorized representatives; and (e) Other causes analogous to the foregoing.",
    tags: ["termination"],
    isActive: true,
  },
  {
    citation: "Labor Code of the Philippines, Article 298 [formerly Art. 283]",
    title:
      "Closure of Establishment and Reduction of Personnel (Authorized Causes)",
    sourceType: "labor_code",
    provisionNumber: "Art. 298",
    provisionText:
      "The employer may also terminate the employment of any employee due to the installation of labor-saving devices, redundancy, retrenchment to prevent losses or the closing or cessation of operation of the establishment or undertaking unless the closing is for the purpose of circumventing the provisions of this Title, by serving a written notice on the workers and the Ministry of Labor and Employment at least one (1) month before the intended date thereof.",
    tags: ["termination"],
    isActive: true,
  },
  {
    citation: "Labor Code of the Philippines, Article 296 [formerly Art. 281]",
    title: "Probationary Employment",
    sourceType: "labor_code",
    provisionNumber: "Art. 296",
    provisionText:
      "Probationary employment shall not exceed six (6) months from the date the employee started working, unless it is covered by an apprenticeship agreement stipulating a longer period. The services of an employee who has been engaged on a probationary basis may be terminated for a just cause or when he fails to qualify as a regular employee in accordance with reasonable standards made known by the employer to the employee at the time of his engagement. An employee who is allowed to work after a probationary period shall be considered a regular employee.",
    tags: ["probationary_period", "termination"],
    isActive: true,
  },
  {
    citation: "Civil Code of the Philippines, Article 1306",
    title: "Autonomous Stipulations and Public Policy",
    sourceType: "other",
    provisionNumber: "Art. 1306",
    provisionText:
      "The contracting parties may establish such stipulations, clauses, terms and conditions as they may deem convenient, provided they are not contrary to law, morals, good customs, public order, or public policy. Restrictive post-employment covenants must be reasonable as to duration, geographic scope, and protected proprietary trade secrets.",
    tags: ["non_compete"],
    isActive: true,
  },
  {
    citation: "Labor Code of the Philippines, Article 113",
    title: "Wage Deductions",
    sourceType: "labor_code",
    provisionNumber: "Art. 113",
    provisionText:
      "No employer, in his own behalf or in behalf of any person, shall make any deduction from the wages of his employees, except: (a) In cases where the worker is insured with his consent by the employer, and the deduction is to recompense the employer for the amount paid by him as premium on the insurance; (b) For union dues, in cases where the right of the worker or his union to check-off has been recognized by the employer or authorized in writing by the individual worker concerned; and (c) In cases where the employer is authorized by law or regulations issued by the Secretary of Labor.",
    tags: ["wage_deductions", "wage_and_hours"],
    isActive: true,
  },
  {
    citation: "Labor Code of the Philippines, Article 114",
    title: "Deposits for Loss or Damage (Cash Bonds)",
    sourceType: "labor_code",
    provisionNumber: "Art. 114",
    provisionText:
      "No employer shall require his worker to make deposits from which deductions shall be made for the reimbursement of loss of or damage to tools, materials, or equipment supplied by the employer, except when the employer is engaged in such trades, occupations or business where the practice of making deductions or requiring deposits is a recognized one, or is necessary or desirable as determined by the Secretary of Labor and Employment in appropriate rules and regulations.",
    tags: ["wage_deductions"],
    isActive: true,
  },
  {
    citation: "Labor Code of the Philippines, Articles 83-87",
    title: "Normal Hours of Work and Overtime Pay",
    sourceType: "labor_code",
    provisionNumber: "Arts. 83-87",
    provisionText:
      "The normal hours of work of any employee shall not exceed eight (8) hours a day. Work may be performed beyond eight (8) hours a day provided that the employee is paid for the overtime work, an additional compensation equivalent to his regular wage plus at least twenty-five percent (25%) thereof. Work performed on a rest day or holiday shall be paid an additional compensation of at least thirty percent (30%) of regular wage.",
    tags: ["working_hours_overtime", "wage_and_hours"],
    isActive: true,
  },
  {
    citation: "DOLE Department Order No. 147-15",
    title:
      "Amending the Rules Implementing Book VI of the Labor Code (Due Process Guidelines)",
    sourceType: "dole_department_order",
    provisionNumber: "DO 147-15",
    provisionText:
      "Guarantees statutory two-notice rule for termination: first written notice stating the particular acts or omissions charged with reasonable opportunity to explain within a minimum of five (5) calendar days, and second written notice indicating that all circumstances were considered and grounds established to justify termination.",
    tags: ["termination"],
    isActive: true,
  },
  {
    citation: "DOLE Department Order No. 174-17",
    title:
      "Rules Implementing Articles 106 to 109 of the Labor Code (Subcontracting Regulations)",
    sourceType: "dole_department_order",
    provisionNumber: "DO 174-17",
    provisionText:
      "Strictly prohibits labor-only contracting where the contractor does not have substantial capital or investment and the employees recruited and placed perform activities directly related to the main business of the principal.",
    tags: ["contracting_and_subcontracting"],
    isActive: true,
  },
  {
    citation: "Presidential Decree No. 851",
    title: "13th Month Pay Law",
    sourceType: "republic_act",
    provisionNumber: "PD 851",
    provisionText:
      "Mandates all employers to pay their rank-and-file employees a 13th month pay not later than December 24 of every year, equivalent to one-twelfth (1/12) of the basic salary earned by an employee within a calendar year, provided the employee worked at least one (1) month.",
    tags: ["wage_and_hours"],
    isActive: true,
  },
];

async function seedCorpus() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/lingkod-batas";
  // eslint-disable-next-line no-console
  console.log(
    `[Seed] Connecting to MongoDB: ${mongoUri.replace(/:[^:]*@/, ":****@")}...`,
  );

  await mongoose.connect(mongoUri);

  // eslint-disable-next-line no-console
  console.log(
    `[Seed] Ingesting ${SEED_DATA.length} core statutory provisions...`,
  );

  let inserted = 0;
  let updated = 0;

  for (const item of SEED_DATA) {
    const res = await StatutorySource.findOneAndUpdate(
      { citation: item.citation },
      { $set: item },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (res) {
      if (
        res.createdAt &&
        res.updatedAt &&
        res.createdAt.getTime() === res.updatedAt.getTime()
      ) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[Seed] Successfully synchronized statutory corpus: ${inserted} added, ${updated} updated.`,
  );
  await mongoose.disconnect();
}

seedCorpus().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[Seed Error]:", err);
  process.exit(1);
});
