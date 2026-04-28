import { useState, useMemo } from "react";

const DATA = [
  {
    id: "0",
    section: "0. Placement Goal / Target",
    tiers: [
      {
        title: "TIER 3 (UP TO 5 LPA)",
        items: [{ label: "Aiming for Service Based / Core Companies (< 5 LPA)", marks: 0, groupId: "target" }]
      },
      {
        title: "TIER 2 (5 - 10 LPA)",
        items: [{ label: "Aiming for Mid-Product / Startups (5-10 LPA)", marks: 0, groupId: "target" }]
      },
      {
        title: "TIER 1 (ABOVE 10 LPA)",
        items: [{ label: "Aiming for Top Product / FAANG (10+ LPA)", marks: 0, groupId: "target" }]
      }
    ]
  },
  {
    id: "1",
    section: "1. Coding Problems Solved",
    tiers: [
      {
        title: "TIER 3",
        description: "Minimum 150 problems on any platform (HackerRank / CodeChef / LeetCode / SkillRack) including 50+ LeetCode.",
        items: [{ label: "10 Marks", marks: 10, isPill: true }]
      },
      {
        title: "TIER 2",
        description: "Minimum 250 problems on any platform (HackerRank / CodeChef / LeetCode / SkillRack), including 100+ LeetCode.",
        items: [{ label: "20 Marks", marks: 20, isPill: true }]
      },
      {
        title: "TIER 1",
        description: "Minimum 500 problems on any platform (HackerRank / CodeChef / LeetCode / SkillRack), including 150+ LeetCode.",
        items: [{ label: "30 Marks", marks: 30, isPill: true }]
      }
    ]
  },
  {
    id: "2",
    section: "2. Open Source Contribution",
    tiers: [
      {
        title: "TIER 3",
        items: [
          { label: "One beginner issue solved (GitHub) [ 5 marks ]", marks: 5 },
          { label: "GSSOC/GSoC registration + 1 PR attempt [ Feb to April] [ 5 marks ]", marks: 5 },
          { label: "Joined GitHub issues/discussions [ 5 marks ]", marks: 5 }
        ]
      },
      {
        title: "TIER 2",
        items: [
          { label: "GitHub: 1-2 merged PRs (public repo) [ 5 marks ]", marks: 5 },
          { label: "GSSOC/GSoC: Contributor badge [ Feb to April] [ 10 mark ]", marks: 10 },
          { label: "Contributor tag in any OSS community [ 10 marks ]", marks: 10 }
        ]
      },
      {
        title: "TIER 1",
        items: [
          { label: "Github: 3+ merged PRs (public repos) [ 10 marks ]", marks: 10 },
          { label: "GSSOC/GSoC: Top Contributor / Gold Badge [ Feb to April] [ 20 marks ]", marks: 20 },
          { label: "Maintainer/co-maintainer of repo (50+ stars) [ 20 marks ]", marks: 20 },
          { label: "OSS organization project completed [ 20 marks ]", marks: 20 }
        ]
      }
    ]
  },
  {
    id: "3",
    section: "3. Competition Achievement",
    tiers: [
      {
        title: "TIER 3",
        items: [
          { label: "CodeVita Round 1 Participation [ October- December] [ 5 marks ]", marks: 5 },
          { label: "CodeChef Starters (Beginner Track) [ 10 marks ]", marks: 10 },
          { label: "AtCoder Beginner Contest (ABC) [A-B] [ 10 marks ]", marks: 10 },
          { label: "CSES Practice Milestones 1 [ 10 marks ]", marks: 10 },
          { label: "TopCoder SRM (Division 2) - Easy [ 5 marks ]", marks: 5 }
        ]
      },
      {
        title: "TIER 2",
        items: [
          { label: "CodeVita Round 2 - Cleared [ October- December] [ 20 marks ]", marks: 20 },
          { label: "Internal hackathon Winner [ 10 marks ]", marks: 10 },
          { label: "TechGig Practice Challenges [ 10 marks ]", marks: 10 },
          { label: "Algoutsav - NIT [December] clear Preliminary Round [ 20 marks ]", marks: 20 },
          { label: "AtCoder Beginner Contest (ABC) [A-D] [ 20 marks ]", marks: 20 },
          { label: "Codeforces Educational Rounds [ 10 marks ]", marks: 10 },
          { label: "HackerEarth Circuits — Top 40% [ 20 marks ]", marks: 20 },
          { label: "CodeChef Long/Starters — Top 25% [ 20 marks ]", marks: 20 },
          { label: "CSES Practice Milestones 1 & 2 [ 20 marks ]", marks: 20 },
          { label: "TopCoder SRM (Division 2) - Intermediate [ 10 marks ]", marks: 10 }
        ]
      },
      {
        title: "TIER 1",
        items: [
          { label: "ICPC Regional Finalist (College Level Topper) [ 30 marks ]", marks: 30 },
          { label: "Code Gladiators finalist [ June — September ] [ 20 marks ]", marks: 20 },
          { label: "AlgoUtsav - NIT Finalist [ 30 marks ]", marks: 30 },
          { label: "Codeforces Global Rank (Top 20% or better) [ 30 marks ]", marks: 30 },
          { label: "AtCoder Regular Contest - High Rank [ 30 marks ]", marks: 30 },
          { label: "HackerEarth Circuits - Top 20% [ 30 marks ]", marks: 30 },
          { label: "LeetCode Weekly Top 5% [ 30 marks ]", marks: 30 },
          { label: "CodeChef Long/Starters Contest — Top 10% [ 30 marks ]", marks: 30 },
          { label: "CSES Practice Milestones [1-3] [ 30 marks ]", marks: 30 },
          { label: "TopCoder SRM (Division 1) [ 30 marks ]", marks: 30 }
        ]
      }
    ]
  },
  {
    id: "4",
    section: "4. Certificate Requirement",
    tiers: [
      {
        title: "TIER 3",
        subHeaders: [
          { label: "PICK 2", items: [
            { label: "1.Fundamental Algorithms", marks: 5 },
            { label: "2.Data Base Management System", marks: 5 },
            { label: "3.Fundamentals of Database Systems", marks: 5 },
            { label: "4.Programming in C++", marks: 5 },
          ]},
          { label: "", items: [
            { label: "Wipro Future Skill Certificate [ 10 Marks ]", marks: 10 },
            { label: "Any one International Certificate [ 10 Marks ]", marks: 10 }
          ]}
        ],
        footer: "NPTEL - ELITE - 5 MARKS SILVER - 10 MARKS GOLD - 20 MARKS"
      },
      {
        title: "TIER 2",
        subHeaders: [
          { label: "PICK 2", items: [] },
          { label: "NPTEL 8 WEEK", items: [
            { label: "1.Data Base Management System", marks: 5 },
            { label: "2.Fundamentals of Database Systems", marks: 5 },
            { label: "3.Programming in C++", marks: 5 }
          ]},
          { label: "", items: [
            { label: "Wipro Future Skill Certificate [ 10 Marks ]", marks: 10 },
            { label: "Any one International Certificate [ 10 Marks ]", marks: 10 }
          ]}
        ],
        footer: "NPTEL - ELITE - 5 MARKS SILVER - 10 MARKS GOLD - 20 MARKS"
      },
      {
        title: "TIER 1",
        subHeaders: [
          { label: "PICK 2", items: [] },
          { label: "NPTEL 12 WEEK", items: [
            { label: "1.Getting Started with Competitive Programming", marks: 10 },
            { label: "2.Introduction to Database Systems", marks: 10 }
          ]},
          { label: "NPTEL 8 WEEK", items: [
            { label: "1.Data Base Management System", marks: 5 },
            { label: "2.Fundamentals of Database Systems", marks: 5 },
            { label: "3.Programming in C++ / Java", marks: 5 },
            { label: "4.Data Structures and Algorithms Using Java", marks: 5 }
          ]},
          { label: "", items: [
            { label: "Wipro Future Skill Certificate [ 10 Marks ]", marks: 10 },
            { label: "Any one International Certificate [ 10 Marks ]", marks: 10 }
          ]}
        ],
        footer: "NPTEL - ELITE - 10 MARKS SILVER - 20 MARKS GOLD - 30 MARKS"
      }
    ]
  },
  {
    id: "5",
    section: "5. CP Rating (CodeChef / CodeForces / AtCoder)",
    tiers: [
      {
        title: "TIER 3",
        items: [
          { label: "CodeChef: 1* / 2* [ 10 marks ]", marks: 10 },
          { label: "Codeforces: Newbie (800–999) [ 10 marks ]", marks: 10 },
          { label: "AtCoder: Grey (0–399) [ 10 marks ]", marks: 10 }
        ]
      },
      {
        title: "TIER 2",
        items: [
          { label: "CodeChef: 2* / 3* [ 20 marks ]", marks: 20 },
          { label: "Codeforces: Newbie — Pupil (1000–1199) [ 20 marks ]", marks: 20 },
          { label: "AtCoder: Grey—Brown (400–799) [ 20 marks ]", marks: 20 }
        ]
      },
      {
        title: "TIER 1",
        items: [
          { label: "CodeChef: 3*+ [ 30 marks ]", marks: 30 },
          { label: "Codeforces: Pupil/Specialist (1200–1400+) [ 30 marks ]", marks: 30 },
          { label: "AtCoder: Green (800–1199) [ 30 marks ]", marks: 30 }
        ]
      }
    ]
  },
  {
    id: "6",
    section: "6. Project / Product Development Checkpoint",
    tiers: [
      {
        title: "TIER 3",
        items: [
          { label: "SIH participation", marks: 5 },
          { label: "Kaggle beginner notebook", marks: 5 },
          { label: "Open-source mini-project with at least 10+ GitHub stars", marks: 5 },
          { label: "HackWithInfy participant [Feb–May]", marks: 5 },
          { label: "GRID participant [May–Aug]", marks: 5 },
          { label: "Hackathons by Fortune 500 Companies-Participation", marks: 5 },
          { label: "Naan Mudhalvan Hackathon-Participation", marks: 5 },
          { label: "EDII Tamil Nadu Hackathon-Participation", marks: 5 },
          { label: "TNWISE – Women in STEM Hackathon-Participation", marks: 5 },
          { label: "InnovaTN / State Innovation Challenges -Participation", marks: 5 },
          { label: "PSB / FinTech Hackathons (TN venues)-Participation", marks: 5 }
        ],
        subHeaders: [
          { label: "[ EACH 10 MARKS ]", items: [
            { label: "Google Cloud Arcade (Qwiklabs Challenges) - No Time Specific", marks: 10 },
            { label: "Google Developer Student Clubs (GDSC) – Solution Challenge (Entry Round) -No Time Specific", marks: 10 }
          ]}
        ]
      },
      {
        title: "TIER 2",
        items: [
          { label: "SIH finalist", marks: 10 },
          { label: "Devfolio hackathon shortlist (Top 10)", marks: 10 },
          { label: "Kaggle Bronze / Top 40%", marks: 10 },
          { label: "College project Expo Top 10", marks: 10 },
          { label: "Open-source mini-project with at least 20+ GitHub stars", marks: 10 },
          { label: "HackWithInfy shortlist [Feb–May]", marks: 10 },
          { label: "GRID shortlist [ June ]", marks: 10 },
          { label: "Amazon ML Summer School selected [ July ]", marks: 10 },
          { label: "Hackathons by Fortune 500 Companies-Finalist", marks: 10 },
          { label: "Naan Mudhalvan Hackathon-Finalist", marks: 10 },
          { label: "EDII Tamil Nadu Hackathon-Finalist", marks: 10 },
          { label: "TNWISE – Women in STEM Hackathon-Finalist", marks: 10 },
          { label: "InnovaTN / State Innovation Challenges-Finalist", marks: 10 },
          { label: "PSB / FinTech Hackathons (TN venues)-Finalist", marks: 10 }
        ]
      },
      {
        title: "TIER 1",
        items: [
          { label: "SIH Winner", marks: 20 },
          { label: "Kaggle Silver (Top 10–20%)", marks: 20 },
          { label: "Devfolio national finalist - September–October", marks: 20 },
          { label: "Industry Project Excellence colab", marks: 20 },
          { label: "Facebook Hacker Cup Round 2 [ October ]", marks: 20 },
          { label: "Reply Code Challenge — Global ranking [ March ]", marks: 20 },
          { label: "MLH (Major League Hacking) Hackathon Prizes", marks: 20 },
          { label: "Research Internship at IIT / IISC / NIT / DRDO / any PublicSectorUnit", marks: 20 },
          { label: "Hackathons by Fortune 500 Companies-Winner", marks: 20 },
          { label: "Naan Mudhalvan Hackathon-Winner", marks: 20 },
          { label: "EDII Tamil Nadu Hackathon-Winner", marks: 20 },
          { label: "TNWISE – Women in STEM Hackathon-Winner", marks: 20 },
          { label: "InnovaTN / State Innovation Challenges-Winner", marks: 20 },
          { label: "PSB / FinTech Hackathons (TN venues)-Winner", marks: 20 }
        ]
      }
    ]
  },
  {
    id: "7",
    section: "7. Aptitude Checkpoint",
    tiers: [
      {
        title: "TIER 3",
        items: [
          { label: "TCS NQT Cleared", marks: 5 },
          { label: "Internal aptitude test pass [ Skillrack ]", marks: 5 },
          { label: "Infosys Springboard Skill Assessments", marks: 5 },
          { label: "Naukri FAST Cleared", marks: 5 },
          { label: "Unstop Aptitude Challenges Cleared", marks: 5 }
        ]
      },
      {
        title: "TIER 2",
        items: [
          { label: "TCS NQT Cognitive >= 75%", marks: 10 },
          { label: "Internal aptitude test >= 75%", marks: 10 },
          { label: "Infosys Springboard Skill Assessments >= 75%", marks: 10 },
          { label: "Naukri FAST >= 75%", marks: 10 },
          { label: "Unstop Aptitude Challenges >= 75%", marks: 10 }
        ]
      },
      {
        title: "TIER 1",
        items: [
          { label: "HackerRank Problem Solving (Gold)", marks: 20 },
          { label: "TCS NQT Cognitive >= 85%", marks: 20 },
          { label: "Internal aptitude test >= 85%", marks: 20 },
          { label: "Infosys Springboard Skill Assessments >= 85%", marks: 20 },
          { label: "Naukri FAST >= 85%", marks: 20 },
          { label: "Unstop Aptitude Challenges >= 85%", marks: 20 }
        ]
      }
    ]
  }
];

export default function Checklist() {
  const [selections, setSelections] = useState({});

  const toggle = (id, groupId) => {
    setSelections((prev) => {
      const newState = { ...prev };
      
      // If it belongs to a radio group (like row 0), clear other selections in that group
      if (groupId) {
        Object.keys(newState).forEach(key => {
          if (key.includes(`-${groupId}`)) delete newState[key];
        });
      }

      newState[id] = !prev[id];
      return newState;
    });
  };

  const scores = useMemo(() => {
    let t3 = 0, t2 = 0, t1 = 0;

    DATA.forEach((section) => {
      section.tiers.forEach((tier, tIdx) => {
        let tierSum = 0;
        
        const countItem = (item, key) => {
          if (selections[key]) tierSum += item.marks;
        };

        // Sections 4 & 6 have complex structure
        if (section.id === "4" || section.id === "6") {
          tier.subHeaders?.forEach((sh, shIdx) => {
            sh.items?.forEach((item, iIdx) => {
              countItem(item, `${section.id}-${tIdx}-${shIdx}-${iIdx}`);
            });
          });
        }
        // Standard items (even if they have subHeaders, normal items might exist)
        tier.items?.forEach((item, iIdx) => {
          countItem(item, `${section.id}-${tIdx}-${iIdx}`);
        });

        if (tIdx === 0) t3 += tierSum;
        if (tIdx === 1) t2 += tierSum;
        if (tIdx === 2) t1 += tierSum;
      });
    });

    return { t3, t2, t1 };
  }, [selections]);

  const maxScores = useMemo(() => {
    let t3 = 0, t2 = 0, t1 = 0;
    DATA.forEach((section) => {
      section.tiers.forEach((tier, tIdx) => {
        let tierSum = 0;
        if (section.id === "4" || section.id === "6") {
          tier.subHeaders?.forEach((sh) => {
            sh.items?.forEach((item) => { tierSum += item.marks; });
          });
        }
        tier.items?.forEach((item) => { tierSum += item.marks; });
        if (tIdx === 0) t3 += tierSum;
        if (tIdx === 1) t2 += tierSum;
        if (tIdx === 2) t1 += tierSum;
      });
    });
    return { t3, t2, t1 };
  }, []);

  const eligibility = useMemo(() => {
    if (scores.t1 >= 30) return { text: "Eligible", color: "text-green-600" };
    if (scores.t2 >= 40) return { text: "Eligible", color: "text-blue-600" };
    if (scores.t3 >= 30) return { text: "Eligible", color: "text-yellow-600" };
    return { text: "Not Eligible", color: "text-[#ff4d4d]" };
  }, [scores]);

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] font-sans text-slate-800">
      {/* HEADER SECTION */}
      <div className="p-6 flex flex-col xl:flex-row gap-6 items-start">
        

        {/* PROGRESS CARD */}
        <div className="w-full md:w-[620px] bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Progress</h3>
          
          <div className="space-y-6">
            {[
              { label: "Tier 1 Progress", progress: Math.round((scores.t1 / maxScores.t1) * 100) || 0, color: "bg-emerald-500" },
              { label: "Tier 2 Progress", progress: Math.round((scores.t2 / maxScores.t2) * 100) || 0, color: "bg-blue-500" },
              { label: "Tier 3 Progress", progress: Math.round((scores.t3 / maxScores.t3) * 100) || 0, color: "bg-amber-500" }
            ].map((p, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[14px] font-bold text-slate-700 tracking-tight">{p.label}</span>
                  <span className="text-[14px] font-black text-slate-900">{p.progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${p.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE BREAKDOWN */}
        <div className="w-full md:w-[320px] bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-300">📊</span>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score Breakdown</h3>
          </div>
          <div className="flex justify-between items-center gap-2">
            {[
              { label: "Tier 3", val: scores.t3 },
              { label: "Tier 2", val: scores.t2 },
              { label: "Tier 1", val: scores.t1 }
            ].map((s, idx) => (
              <div key={idx} className="flex-1 bg-[#f8fafc] border border-slate-100 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
                <p className="text-xl font-black text-slate-800 leading-none">{s.val}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 mt-4 text-center italic font-medium">
            ⓘ Scores are calculated based on your selections below.
          </p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="px-6 pb-20 overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-6 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[20%]">Criteria Parameter</th>
              <th className="py-6 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[26%]">Tier 3 (Up to 5 LPA)</th>
              <th className="py-6 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[26%]">Tier 2 (5 - 10 LPA)</th>
              <th className="py-6 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[26%]">Tier 1 (Above 10 LPA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DATA.filter(row => row.id !== "0").map((row, rIdx) => (
              <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                <td className="py-10 px-4 align-top">
                  <h4 className="text-[13px] font-bold text-slate-800 leading-tight pr-4">{row.section}</h4>
                </td>
                
                {row.tiers.map((tier, tIdx) => (
                  <td key={tIdx} className={`py-10 px-6 align-top border-l border-slate-50 relative`}>
                    
                    {/* Row 1 Specific Layout */}
                    {row.id === "1" && (
                      <div className="flex flex-col items-center">
                        <p className="text-[13px] font-bold text-slate-700 leading-snug text-center mb-8 max-w-[200px]">
                          {tier.description}
                        </p>
                      </div>
                    )}

                    {/* Section 4 Specific Headers */}
                    {row.id === "4" ? (
                      <div className="space-y-8">
                        {tier.subHeaders?.map((sh, shIdx) => (
                          <div key={shIdx}>
                            {sh.label && (
                              <div className="mb-4 text-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 pb-1 px-4">
                                  {sh.label}
                                </span>
                              </div>
                            )}
                            <div className="space-y-4">
                              {sh.items?.map((item, iIdx) => {
                                const key = `${row.id}-${tIdx}-${shIdx}-${iIdx}`;
                                const isSelected = selections[key];
                                return (
                                  <div 
                                    key={iIdx} 
                                    onClick={() => toggle(key)}
                                    className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? "bg-[#f0f7ff] border-blue-200 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50"}`}
                                  >
                                    <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-slate-200 group-hover:border-blue-300"}`}>
                                      {isSelected && <span className="text-white text-[10px] font-black">✔</span>}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-[11px] font-bold leading-snug ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                                        {item.label}
                                      </span>
                                      {item.marks > 0 && (
                                        <span className={`text-[10px] font-black mt-1 ${isSelected ? "text-blue-600" : "text-blue-500/40"}`}>
                                          +{item.marks}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard Rows */
                      <div className={`space-y-4 ${row.id === "1" ? "flex flex-col items-center" : ""}`}>
                        {tier.items?.map((item, iIdx) => {
                          const key = `${row.id}-${tIdx}-${iIdx}${item.groupId ? `-${item.groupId}` : ""}`;
                          const isSelected = selections[key];
                          
                          if (item.isPill) {
                             return (
                               <div 
                                 key={iIdx} 
                                 onClick={() => toggle(key)}
                                 className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${isSelected ? "bg-blue-500 text-white shadow-md shadow-blue-100" : "bg-[#f1f5f9] text-slate-400 hover:bg-slate-200"}`}
                               >
                                 {item.label}
                               </div>
                             );
                          }

                          return (
                            <div 
                              key={iIdx} 
                              onClick={() => toggle(key, item.groupId)}
                              className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? "bg-[#f0f7ff] border-blue-200 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50"}`}
                            >
                              <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-slate-200 group-hover:border-blue-300"}`}>
                                {isSelected && <span className="text-white text-[10px] font-black">✔</span>}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[11px] font-bold leading-snug ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                                  {item.label}
                                </span>
                                {item.marks > 0 && (
                                  <span className={`text-[10px] font-black mt-1 ${isSelected ? "text-blue-600" : "text-blue-500/40"}`}>
                                    +{item.marks}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer / Notes */}
                    {tier.footer && (
                      <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter leading-tight px-4">
                          {tier.footer}
                        </p>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}