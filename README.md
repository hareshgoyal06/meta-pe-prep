# Meta PE Prep

Interactive study site for the Meta Production Engineering interview: system design (primary focus), operating systems, Linux troubleshooting, networking, and an interview kit.

**Open `index.html` in a browser** — no build step, no server needed. Progress (done sections, checklists) is saved in localStorage.

## Pages
| Page | Contents |
|---|---|
| `index.html` | Roadmap, how to study, numbers to memorize, latency ladder |
| `system-design.html` | 17 chapters: foundations → estimation → scaling/LB → caching → databases → replication → sharding → consistency/CAP → consensus → queues → resilience → architecture → storage → observability/SRE → security. 10 interactive simulators (consistent hashing, token bucket, load balancer, LRU, quorum, Raft election, CAP, backoff, availability, estimator). |
| `case-studies.html` | 12 full walkthroughs incl. PE-flavored ones (metrics system, log pipeline, config distribution, deploy system, job scheduler) |
| `os.html` | Processes, fork/exec stepper, threads, scheduling, virtual memory, OOM, FDs/inodes, signals, IPC, epoll, boot, containers |
| `linux.html` | 60-second triage, tool tables by resource, /proc, systemd, shell one-liners, 12 incident scenarios |
| `networking.html` | Layers, CIDR calculator, animated TCP lifecycle, UDP/QUIC, DNS, HTTP/1-3, TLS, LBs, "type a URL", troubleshooting playbook |
| `interview.html` | Process, scoring, answer templates, 60+ Q&A, flashcards, cheat sheets, mock prompts, readiness checklist |

## Hosting
Enable GitHub Pages (Settings → Pages → Deploy from branch `main`, root) to read it on any device.
