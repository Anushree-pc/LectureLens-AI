import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samplesDir = path.join(__dirname, '..', 'samples');
const publicDir = path.join(__dirname, '..', 'client', 'public');

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath1 = path.join(samplesDir, 'CS301_Virtual_Memory_Lecture.pdf');
const outputPath2 = path.join(publicDir, 'sample_lecture.pdf');

function buildPdf(outputPath) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Title
  doc.fontSize(22).font('Helvetica-Bold').text('CS301: Operating Systems & Architecture', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica').fillColor('#2563eb').text('Lecture 8: Virtual Memory, Paging, and Page Replacement Algorithms', { align: 'center' });
  doc.moveDown(1);
  doc.fillColor('#000000');

  // Metadata
  doc.fontSize(10).font('Helvetica-Oblique').text('Instructor: Dr. Alan Sterling | Department of Computer Science & Engineering | Semester Fall 2026', { align: 'center' });
  doc.moveDown(1.5);

  // Section 1
  doc.fontSize(14).font('Helvetica-Bold').text('1. Introduction to Virtual Memory');
  doc.fontSize(10).font('Helvetica').text(
    'Virtual memory is a memory management capability of an operating system that uses hardware and software to allow a computer to compensate for physical memory shortages by temporarily transferring data from random access memory (RAM) to disk storage. It provides each process with its own contiguous, private logical address space, entirely decoupled from physical memory hardware constraints.'
  );
  doc.moveDown(0.8);
  doc.text(
    'Key Benefits of Virtual Memory:\n' +
    '• Multiprogramming beyond physical RAM capacity: Processes larger than physical RAM can execute seamlessly.\n' +
    '• Memory Protection: Isolation prevents errant or malicious processes from reading or overwriting other processes’ memory spaces.\n' +
    '• Shared Memory: Libraries (such as libc or DirectX) can be shared across multiple processes via read-only shared physical frames.\n' +
    '• Efficient Process Creation: System calls like fork() utilize Copy-On-Write (COW) semantics.'
  );
  doc.moveDown(1.2);

  // Section 2
  doc.fontSize(14).font('Helvetica-Bold').text('2. Paging Mechanism & Address Translation');
  doc.fontSize(10).font('Helvetica').text(
    'In a paging system, the logical address space is divided into fixed-size blocks called pages (typically 4 KB in size). Physical memory is partitioned into matching fixed-size blocks called frames. Address translation is orchestrated in hardware by the Memory Management Unit (MMU).'
  );
  doc.moveDown(0.8);
  doc.text(
    'Logical Address Structure:\n' +
    'A virtual address consists of two components: [ Page Number (p) | Offset (d) ].\n' +
    '• Page Number (p): Index into the process page table to identify the base physical frame number (f).\n' +
    '• Offset (d): Displacement within the page/frame. The offset is copied directly into the physical address.\n' +
    'Mathematical decomposition: For page size S = 2^n, Offset d = Address mod S, Page Number p = Address / S.'
  );
  doc.moveDown(1.2);

  // Section 3
  doc.fontSize(14).font('Helvetica-Bold').text('3. Translation Lookaside Buffer (TLB) and Effective Access Time');
  doc.fontSize(10).font('Helvetica').text(
    'Accessing a page table in physical memory adds memory bus latency to every instruction. To mitigate this overhead, CPUs employ a Translation Lookaside Buffer (TLB), a fast associative hardware cache storing recent page-to-frame translations.'
  );
  doc.moveDown(0.8);
  doc.text(
    'Effective Access Time (EAT) Formula:\n' +
    'Let alpha be the TLB hit ratio, epsilon be the TLB search time (~1 ns), and m be the main memory access time (~100 ns).\n' +
    'Formula: EAT = alpha * (epsilon + m) + (1 - alpha) * (epsilon + 2m)\n' +
    'When accounting for Page Fault Rate p (where disk access time is ~10 ms = 10,000,000 ns):\n' +
    'EAT = (1 - p) * m + p * (Page Fault Overhead Time)\n' +
    'Even if p = 0.001 (one fault in 1000 references), the effective memory access latency degrades by a factor of nearly 100x.'
  );
  doc.moveDown(1.2);

  // Section 4
  doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').text('4. Page Replacement Algorithms');
  doc.fontSize(10).font('Helvetica').text(
    'When a page fault occurs and all physical memory frames are currently allocated, the operating system must choose a victim frame to evict. If the victim frame is marked dirty (modified), it must be written to disk; if clean, it can simply be overwritten.'
  );
  doc.moveDown(0.8);
  doc.text(
    '1. First-In, First-Out (FIFO):\n' +
    'Replaces the oldest loaded page in memory. Suffers from Belady\'s Anomaly, where increasing the number of physical frames allocated to a process results in MORE page faults rather than fewer.\n\n' +
    '2. Optimal Page Replacement (OPT / MIN):\n' +
    'Replaces the page that will not be used for the longest period of time in the future. Has the lowest possible page fault rate of any algorithm. However, OPT is impossible to implement in practice because future reference strings cannot be known by the OS. It serves exclusively as a benchmark.\n\n' +
    '3. Least Recently Used (LRU):\n' +
    'Replaces the page that has not been referenced for the longest period in the past. LRU is a stack algorithm, which mathematically guarantees that it NEVER suffers from Belady\'s Anomaly. Implemented using hardware reference timestamps or doubly linked lists.'
  );
  doc.moveDown(1.2);

  // Section 5
  doc.fontSize(14).font('Helvetica-Bold').text('5. Thrashing and the Working Set Model');
  doc.fontSize(10).font('Helvetica').text(
    'Thrashing is a catastrophic operating system condition where processes spend more time paging in and out of secondary storage than executing CPU instructions. As page fault rates skyrocket, CPU utilization plunges toward zero. The OS misinterprets low CPU utilization as a sign that multiprogramming should be increased, launching additional processes and worsening the thrashing cycle.'
  );
  doc.moveDown(0.8);
  doc.text(
    'Peter Denning’s Working Set Strategy:\n' +
    'The Working Set Model defines WSS_i as the set of pages referenced by process i within the most recent delta time window. The operating system monitors the sum of all working set sizes. If sum(WSS_i) > Total Available Memory Frames, the system is thrashing, and the OS must temporarily suspend one or more processes, swap them to disk completely, and reallocate their frames to the remaining active processes.'
  );
  doc.moveDown(1.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Exam Takeaways & Common Pitfalls:');
  doc.fontSize(10).font('Helvetica').text(
    '• Remember: Belady\'s Anomaly impacts FIFO; LRU and OPT are provably exempt.\n' +
    '• Dirty Bit: Always check whether eviction requires a disk write.\n' +
    '• Paging eliminates external fragmentation, but causes internal fragmentation.'
  );

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`Generated PDF at ${outputPath}`);
      resolve();
    });
  });
}

async function run() {
  await buildPdf(outputPath1);
  await buildPdf(outputPath2);
  console.log('Sample lecture PDFs generated successfully!');
}

run();
