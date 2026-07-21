import { PrismaClient, EMIStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up existing data (in correct order)
  await prisma.transaction.deleteMany();
  await prisma.escrowEntry.deleteMany();
  await prisma.eMI.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();

  // Create Admins
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin1 = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@cred91.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Created admin: ${admin1.email}`);

  // Create Borrowers
  const borrowerPassword = await bcrypt.hash("borrower123", 12);
  
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@example.com",
      password: borrowerPassword,
      phone: "9876543210",
      role: "BORROWER",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya@example.com",
      password: borrowerPassword,
      phone: "9876543211",
      role: "BORROWER",
    },
  });

  console.log("Created borrowers");

  // Create Applications
  
  // 1. Rahul - Approved Application
  const rahulApp = await prisma.application.create({
    data: {
      userId: rahul.id,
      fullName: "Rahul Sharma",
      dateOfBirth: new Date("1990-05-15"),
      address: "123, MG Road, Bangalore",
      phone: "9876543210",
      employmentType: "SALARIED",
      employer: "TechCorp India",
      monthlyIncome: 120000,
      yearsEmployed: 5,
      amount: 500000,
      tenure: 24,
      purpose: "Home Renovation",
      creditScore: 780,
      status: "APPROVED",
      interestRate: 10.5,
      reviewNote: "Good credit score, stable income. Approved.",
      reviewedBy: admin1.id,
      reviewedAt: new Date(),
    },
  });

  // 2. Priya - Pending Application
  await prisma.application.create({
    data: {
      userId: priya.id,
      fullName: "Priya Patel",
      dateOfBirth: new Date("1995-08-22"),
      address: "456, Linking Road, Mumbai",
      phone: "9876543211",
      employmentType: "BUSINESS",
      employer: "Patel Boutiques",
      monthlyIncome: 85000,
      yearsEmployed: 3,
      amount: 800000,
      tenure: 36,
      purpose: "Business Expansion",
      creditScore: 680,
      status: "PENDING",
    },
  });

  console.log("Created applications");

  // Create Loan for Rahul (Approved)
  const principal = 500000;
  const rate = 10.5;
  const tenure = 24;
  
  // Simplified EMI calc for seed
  const r = rate / 12 / 100;
  const emiAmount = Math.round(
    (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1)
  );

  const loan = await prisma.loan.create({
    data: {
      applicationId: rahulApp.id,
      principal,
      interestRate: rate,
      tenureMonths: tenure,
      monthlyEMI: emiAmount,
      totalInterest: (emiAmount * tenure) - principal,
      totalAmount: emiAmount * tenure,
      outstandingBalance: principal - (emiAmount * 0.8), // Mocking some progress
      status: "ACTIVE",
      escrowBalance: 2500, // 0.5% initial deposit
      disbursedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    },
  });

  // Create Escrow Entry
  await prisma.escrowEntry.create({
    data: {
      loanId: loan.id,
      type: "DEPOSIT",
      amount: 2500,
      description: "Initial insurance & tax impound deposit",
      balanceAfter: 2500,
    },
  });

  // Create EMIs for Rahul's Loan
  let balance = principal;
  const emis = [];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 1 month ago

  for (let i = 1; i <= tenure; i++) {
    const interestComponent = balance * r;
    const principalComponent = emiAmount - interestComponent;
    balance -= principalComponent;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    // Make first EMI PAID, second DUE
    const status = (i === 1 ? "PAID" : i === 2 ? "DUE" : "DUE") as EMIStatus;
    // Adjust due dates to make sense with status
    if (i > 2) {
      dueDate.setMonth(dueDate.getMonth() + 1); // push future dates out
    }

    emis.push({
      loanId: loan.id,
      emiNumber: i,
      dueDate,
      principalComponent: Math.round(principalComponent),
      interestComponent: Math.round(interestComponent),
      amount: emiAmount,
      outstandingAfter: Math.max(0, Math.round(balance)),
      status,
      paidAt: i === 1 ? new Date(dueDate.getTime() - 86400000) : null,
    });
  }

  await prisma.eMI.createMany({ data: emis });
  
  // Get the paid EMI to create a transaction
  const paidEmi = await prisma.eMI.findFirst({
    where: { loanId: loan.id, emiNumber: 1 }
  });

  if (paidEmi) {
    await prisma.transaction.create({
      data: {
        loanId: loan.id,
        emiId: paidEmi.id,
        amount: paidEmi.amount,
        method: "ONLINE",
        reference: "TXN_SEED_001",
        paidAt: paidEmi.paidAt || new Date(),
      }
    });
  }

  console.log("Created loan, escrow, EMIs, and transactions");

  // Create a Delinquent Loan (Mock User)
  const defaulter = await prisma.user.create({
    data: {
      name: "Amit Kumar",
      email: "amit@example.com",
      password: borrowerPassword,
      phone: "9876543212",
      role: "BORROWER",
    },
  });

  const defaulterApp = await prisma.application.create({
    data: {
      userId: defaulter.id,
      fullName: "Amit Kumar",
      dateOfBirth: new Date("1985-02-10"),
      address: "789, Park Street, Kolkata",
      phone: "9876543212",
      employmentType: "SELF_EMPLOYED",
      monthlyIncome: 60000,
      yearsEmployed: 4,
      amount: 200000,
      tenure: 12,
      purpose: "Medical Emergency",
      creditScore: 580,
      status: "APPROVED",
      interestRate: 18.0,
      reviewNote: "High risk, approved at higher rate.",
      reviewedBy: admin1.id,
      reviewedAt: new Date(),
    },
  });

  const delqLoan = await prisma.loan.create({
    data: {
      applicationId: defaulterApp.id,
      principal: 200000,
      interestRate: 18.0,
      tenureMonths: 12,
      monthlyEMI: 18336,
      totalInterest: 20032,
      totalAmount: 220032,
      outstandingBalance: 200000,
      status: "DELINQUENT",
      delinquentNotes: "Customer unresponsive for 3 months. Field agent visited address but premises locked.",
      disbursedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
    },
  });

  // Create 3 overdue EMIs
  const delqEmis = [];
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date(Date.now() - (4 - i) * 30 * 24 * 60 * 60 * 1000); // 1-3 are in past
    delqEmis.push({
      loanId: delqLoan.id,
      emiNumber: i,
      dueDate,
      principalComponent: 15000, // simplified
      interestComponent: 3336,
      amount: 18336,
      outstandingAfter: 200000 - (15000 * i),
      status: (i <= 3 ? "OVERDUE" : "DUE") as EMIStatus,
    });
  }
  await prisma.eMI.createMany({ data: delqEmis });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
