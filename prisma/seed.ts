import { PrismaClient, ProjectStage } from '@prisma/client'
const prisma = new PrismaClient()
const MERU_WARDS = [
  { wardName: 'Antuambui', subCounty: 'Igembe North' }, { wardName: 'Ntunene', subCounty: 'Igembe North' },
  { wardName: 'Antubetwe Boreine', subCounty: 'Igembe North' }, { wardName: 'Muungaa', subCounty: 'Igembe North' },
  { wardName: 'Lare', subCounty: 'Igembe North' }, { wardName: 'Athwana', subCounty: 'Igembe Central' },
  { wardName: 'Akachiu', subCounty: 'Igembe Central' }, { wardName: 'Kanuni', subCounty: 'Igembe Central' },
  { wardName: 'Kiegoi/Antubochiu', subCounty: 'Igembe Central' }, { wardName: 'Maua', subCounty: 'Igembe Central' },
  { wardName: "Akirang'ondu", subCounty: 'Igembe South' }, { wardName: 'Athiru Gaiti', subCounty: 'Igembe South' },
  { wardName: 'Ragati', subCounty: 'Igembe South' }, { wardName: 'Mbeu', subCounty: 'Igembe South' },
  { wardName: 'Kiengu', subCounty: 'Igembe South' }, { wardName: 'Mbogoni', subCounty: 'Tigania West' },
  { wardName: 'Nkomo', subCounty: 'Tigania West' }, { wardName: 'Kibirichia', subCounty: 'Tigania West' },
  { wardName: 'Kianjai', subCounty: 'Tigania West' }, { wardName: 'Nturuba', subCounty: 'Tigania West' },
  { wardName: 'Ntima East', subCounty: 'Tigania East' }, { wardName: 'Ntima West', subCounty: 'Tigania East' },
  { wardName: 'Muthara', subCounty: 'Tigania East' }, { wardName: 'Karama', subCounty: 'Tigania East' },
  { wardName: 'Micro', subCounty: 'Tigania East' }, { wardName: 'Mwiteria', subCounty: 'Tigania East' },
  { wardName: 'Abothuguchi Central', subCounty: 'Central Imenti' }, { wardName: 'Abothuguchi West', subCounty: 'Central Imenti' },
  { wardName: 'Kiagu', subCounty: 'Central Imenti' }, { wardName: 'Abogeta East', subCounty: 'Central Imenti' },
  { wardName: 'Abogeta West', subCounty: 'Central Imenti' }, { wardName: 'Municipality', subCounty: 'North Imenti' },
  { wardName: 'Ntima', subCounty: 'North Imenti' }, { wardName: 'Nkuene', subCounty: 'North Imenti' },
  { wardName: 'Timau', subCounty: 'North Imenti' }, { wardName: 'Githongo', subCounty: 'North Imenti' },
  { wardName: 'Igoji East', subCounty: 'South Imenti' }, { wardName: 'Igoji West', subCounty: 'South Imenti' },
  { wardName: 'Mitunguu', subCounty: 'South Imenti' }, { wardName: 'Nkuene South', subCounty: 'South Imenti' },
  { wardName: 'Ruiri/Rwarera', subCounty: 'Buuri' }, { wardName: 'Kisima', subCounty: 'Buuri' },
  { wardName: 'Kiirua/Naari', subCounty: 'Buuri' }, { wardName: 'Ruiri', subCounty: 'Buuri' },
  { wardName: 'Nyaki West', subCounty: 'Buuri' },
]
async function main() {
  console.log('Seeding BaiteConnect...')
  const created: {id:number;wardName:string;subCounty:string}[] = []
  for (const [i, ward] of MERU_WARDS.entries()) {
    const w = await prisma.ward.upsert({ where:{id:i+1}, update:{}, create:ward })
    created.push(w)
  }
  console.log(`${created.length} wards`)
  for (const b of [
    { fiscalYear:'2026/2027', sectorName:'Health', allocationBillions:4.20, shillingsPerHundred:40 },
    { fiscalYear:'2026/2027', sectorName:'Agriculture', allocationBillions:2.10, shillingsPerHundred:20 },
    { fiscalYear:'2026/2027', sectorName:'Roads & Infrastructure', allocationBillions:1.58, shillingsPerHundred:15 },
    { fiscalYear:'2026/2027', sectorName:'Water & Environment', allocationBillions:1.58, shillingsPerHundred:15 },
    { fiscalYear:'2026/2027', sectorName:'General Public Service', allocationBillions:1.05, shillingsPerHundred:10 },
  ]) {
    await prisma.fiscalYearBudget.upsert({ where:{fiscalYear_sectorName:{fiscalYear:b.fiscalYear,sectorName:b.sectorName}}, update:{}, create:b })
  }
  console.log('Fiscal budget')
  const find = (name: string) => created.find(w => w.wardName === name)?.id ?? 1
  for (const proj of [
    { wardId:find('Abothuguchi Central'), title:'Machaku Primary School Borehole Drilling', description:'Drilling 120m borehole for 1,800 households.', allocatedBudget:3200000, currentStage:ProjectStage.ONGOING, contractorName:'AquaDrill Engineering Ltd', mcaPriorityMatch:true, latitude:0.0460, longitude:37.6497 },
    { wardId:find('Municipality'), title:'Kinoru Stadium Phase 2 Upgrade', description:'3,000-seat grandstand, floodlights and running track.', allocatedBudget:28000000, currentStage:ProjectStage.TENDERED, contractorName:'SportsBuilders East Africa', mcaPriorityMatch:true, latitude:0.0486, longitude:37.6491 },
    { wardId:find('Muthara'), title:'Muthara-Ntulili Feeder Road Rehabilitation', description:'Grading 12km stretch for farming communities.', allocatedBudget:12500000, currentStage:ProjectStage.ALLOCATED, contractorName:null, mcaPriorityMatch:false, latitude:0.1622, longitude:37.8314 },
    { wardId:find('Timau'), title:'Timau Dairy Cold Storage Facility', description:'50,000-litre milk chilling plant for 4,200 farmers.', allocatedBudget:18750000, currentStage:ProjectStage.ONGOING, contractorName:'ColdTech Africa Ltd', mcaPriorityMatch:true, latitude:0.1744, longitude:37.0952 },
    { wardId:find('Maua'), title:'Igembe Miraa Market Trading Sheds', description:'40-stall permanent concrete trading shed.', allocatedBudget:5200000, currentStage:ProjectStage.TENDERED, contractorName:'Meru County Contractors Sacco', mcaPriorityMatch:false, latitude:0.3543, longitude:37.9254 },
    { wardId:find('Nkuene'), title:'Nkuene Level 4 Health Facility Upgrade', description:'Maternity theatre and 20-bed expansion.', allocatedBudget:7500000, currentStage:ProjectStage.COMPLETED, contractorName:'MedBuild Construction Co.', mcaPriorityMatch:true, latitude:0.0801, longitude:37.6734 },
    { wardId:find('Githongo'), title:'Githongo Water Supply Pipeline Extension', description:'8km HDPE pipeline for 3,400 households.', allocatedBudget:9800000, currentStage:ProjectStage.ONGOING, contractorName:'WaterWorks Kenya Ltd', mcaPriorityMatch:true, latitude:0.1200, longitude:37.1400 },
    { wardId:find('Kibirichia'), title:'Kibirichia ECDE Centre Construction', description:'6-classroom block with library and sanitation.', allocatedBudget:4500000, currentStage:ProjectStage.ALLOCATED, contractorName:null, mcaPriorityMatch:false, latitude:0.2100, longitude:37.5800 },
  ]) {
    const ex = await prisma.project.findFirst({ where:{title:proj.title} })
    if (!ex) await prisma.project.create({ data:{...proj, stageHistory:{create:{stage:proj.currentStage,notes:'Initial entry',updatedBy:'seed'}}} })
  }
  console.log('Projects')
  // Sub-locations for Municipality
  const munId = find('Municipality')
  for (const sl of [
    { name:'Gakoromone', lat:0.0460, lng:37.6497, villages:['Maili Tatu','Kaaga','Kirutune'] },
    { name:'Kithiritiri', lat:0.0530, lng:37.6520, villages:['Githongo','Nkubu','Igandene'] },
    { name:'Makutano', lat:0.0500, lng:37.6560, villages:['Makutano Centre','Weru','Nkari'] },
  ]) {
    const ex = await prisma.subLocation.findFirst({ where:{wardId:munId,name:sl.name} })
    const sub = ex ?? await prisma.subLocation.create({ data:{wardId:munId,name:sl.name,latitude:sl.lat,longitude:sl.lng} })
    for (const v of sl.villages) {
      const ve = await prisma.village.findFirst({ where:{subLocationId:sub.id,name:v} })
      if (!ve) await prisma.village.create({ data:{subLocationId:sub.id,name:v,estimatedPop:Math.floor(Math.random()*600+200)} })
    }
  }
  // Sub-locations for Timau
  const timauId = find('Timau')
  for (const sl of [
    { name:'Timau Township', lat:0.1744, lng:37.0952, villages:['Timau Market','Ontilili','Kiambogo'] },
    { name:'Kisima', lat:0.1800, lng:37.1100, villages:['Kisima','Badda','Sirimon'] },
  ]) {
    const ex = await prisma.subLocation.findFirst({ where:{wardId:timauId,name:sl.name} })
    const sub = ex ?? await prisma.subLocation.create({ data:{wardId:timauId,name:sl.name,latitude:sl.lat,longitude:sl.lng} })
    for (const v of sl.villages) {
      const ve = await prisma.village.findFirst({ where:{subLocationId:sub.id,name:v} })
      if (!ve) await prisma.village.create({ data:{subLocationId:sub.id,name:v,estimatedPop:Math.floor(Math.random()*500+150)} })
    }
  }
  console.log('Sub-locations & villages')
  // MCA proposals
  for (const p of [
    { wardId:find('Timau'), fiscalYear:'2026/2027', title:'Dairy Chilling Plant — Timau', sector:'Agriculture', estimatedCost:18000000 },
    { wardId:find('Municipality'), fiscalYear:'2026/2027', title:'Parking Lot Upgrade — Meru Town', sector:'Roads & Infrastructure', estimatedCost:5000000 },
    { wardId:find('Nkuene'), fiscalYear:'2026/2027', title:'Health Centre Upgrade — Nkuene', sector:'Health', estimatedCost:7500000 },
    { wardId:find('Muthara'), fiscalYear:'2026/2027', title:'Feeder Road Rehab — Muthara', sector:'Roads & Infrastructure', estimatedCost:12000000 },
    { wardId:find('Maua'), fiscalYear:'2026/2027', title:'Market Fencing — Maua', sector:'Agriculture', estimatedCost:2000000 },
  ]) {
    const ex = await prisma.mcaProposal.findFirst({ where:{wardId:p.wardId,fiscalYear:p.fiscalYear,title:p.title} })
    if (!ex) await prisma.mcaProposal.create({ data:p })
  }
  console.log('MCA proposals')
  console.log('\nDone: 45 wards, fiscal budget, 8 projects, sub-locations, villages, MCA proposals')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect())
