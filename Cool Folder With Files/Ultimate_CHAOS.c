/* Ultimate_CHAOS.c
   Native C version of the "Ultimate CHAOS" installer simulator.
   - Windows only (uses Win32 API for MessageBox, Beep, Sleep, console control)
   - Safe: writes only under %USERPROFILE%\Ultimate_CHAOS_Project
   Compile: gcc -O2 -o Ultimate_CHAOS.exe Ultimate_CHAOS.c -luser32
*/

#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdint.h>
#include <string.h>

#define MAX_PATH_LEN 4096

/* Utility: compose path under USERPROFILE */
void join_path(char *out, const char *base, const char *name) {
    if (!base || !name) { out[0] = '\0'; return; }
    snprintf(out, MAX_PATH_LEN, "%s\\%s", base, name);
}

/* Create directory if doesn't exist (recursively flat) */
void ensure_dir(const char *path) {
    if (CreateDirectoryA(path, NULL) || GetLastError() == ERROR_ALREADY_EXISTS) {
        return;
    }
    // Try parent recursion if failed
    char tmp[MAX_PATH_LEN];
    strcpy(tmp, path);
    for (int i = (int)strlen(tmp) - 1; i >= 0; --i) {
        if (tmp[i] == '\\') {
            tmp[i] = '\0';
            CreateDirectoryA(tmp, NULL);
            tmp[i] = '\\';
        }
    }
    CreateDirectoryA(path, NULL);
}

/* Write a random binary file of sizeKB kilobytes */
int create_random_file(const char *path, int sizeKB) {
    FILE *f = fopen(path, "wb");
    if (!f) return 0;
    unsigned char buffer[4096];
    int writtenKB = 0;
    while (writtenKB < sizeKB) {
        int toWrite = sizeof(buffer);
        if ((sizeKB - writtenKB) * 1024 < (int)sizeof(buffer)) {
            toWrite = (sizeKB - writtenKB) * 1024;
        }
        for (int i = 0; i < toWrite; ++i) buffer[i] = (unsigned char)(rand() & 0xFF);
        fwrite(buffer, 1, toWrite, f);
        writtenKB += toWrite / 1024;
    }
    fclose(f);
    return 1;
}

/* Console color helper */
void set_color(WORD attr) {
    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(h, attr);
}

/* Tiny sleep wrapper in ms */
void msleep(int ms) { Sleep((DWORD)ms); }

/* Print spinner for ms duration */
void spinner(int duration_ms) {
    const char spinner_chars[] = "|/-\\";
    int i = 0;
    int elapsed = 0;
    while (elapsed < duration_ms) {
        printf("\r%c", spinner_chars[i % 4]);
        fflush(stdout);
        msleep(80);
        elapsed += 80;
        i++;
    }
    printf("\r ");
}

/* Show progress bar (Unicode block used) */
void show_progress_bar(const char *prefix, uint64_t downloaded, uint64_t total, int width) {
    double pct = 0.0;
    if (total > 0) pct = (double)downloaded / (double)total;
    int filled = (int)(pct * width);
    if (filled > width) filled = width;
    int empty = width - filled;
    // Build bar
    printf("\r%s[", prefix ? prefix : "");
    set_color(FOREGROUND_GREEN | FOREGROUND_INTENSITY);
    for (int i = 0; i < filled; ++i) printf("█");
    set_color(FOREGROUND_INTENSITY | FOREGROUND_RED); // dark gray-ish
    for (int i = 0; i < empty; ++i) printf(" ");
    set_color(FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE);
    printf("] %3.0f%% - %.2f/%.2f MB", pct * 100.0, downloaded / 1048576.0, total / 1048576.0);
    fflush(stdout);
}

/* Run one simulated phase */
int run_phase(const char *phase_name, double size_gb, double inc_mb, double delay_s, int bar_width, const char *projectRoot, double *pXP, int *pLevel) {
    uint64_t total = (uint64_t)(size_gb * 1024.0 * 1024.0 * 1024.0);
    uint64_t inc = (uint64_t)(inc_mb * 1024.0 * 1024.0);
    if (inc < 1) inc = 1;
    uint64_t downloaded = 0;
    int iteration = 0;
    uint64_t maxIterations = (total + inc - 1) / inc;
    // Safety cap
    if (maxIterations > 100000) {
        inc = total / 100000 + 1;
        maxIterations = (total + inc - 1) / inc;
    }
    printf("\n--- %s ---\n", phase_name);
    char prefix[64];
    snprintf(prefix, sizeof(prefix), "%-20s ", phase_name);
    while (downloaded < total) {
        iteration++;
        uint64_t add = inc;
        if (downloaded + add > total) add = total - downloaded;
        downloaded += add;
        show_progress_bar(prefix, downloaded, total, bar_width);
        // XP: small randomized gain per increment
        double mb = (double)add / 1048576.0;
        double xpGain = mb * (0.01 + (rand() % 100) / 1000.0); // roughly proportional
        *pXP += xpGain;
        // Level check simple
        while (*pXP >= (*pLevel) * 100.0) {
            *pXP -= (*pLevel) * 100.0;
            (*pLevel)++;
            // beep and message
            Beep(800, 120);
            set_color(FOREGROUND_GREEN | FOREGROUND_INTENSITY);
            printf("\n>>> ACHIEVEMENT: LEVEL UP! Now Level %d <<<\n", *pLevel);
            set_color(FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE);
        }
        // small random glitch
        if ((rand() % 100) < 6) {
            set_color(FOREGROUND_RED | FOREGROUND_INTENSITY);
            printf("\r%s GLITCH! ", prefix);
            fflush(stdout);
            msleep(60 + (rand() % 160));
            set_color(FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE);
        }
        msleep((int)(delay_s * 1000));
        // occasionally perform a small chaos event (create temp files)
        if ((iteration % (int)maxIterations/8 == 0) || (rand() % 100 < 5)) {
            // create a few small files
            char tmpath[MAX_PATH_LEN];
            for (int j = 0; j < 3; ++j) {
                snprintf(tmpath, sizeof(tmpath), "%s\\temp\\chaos_%d.tmp", projectRoot, rand() % 1000000);
                create_random_file(tmpath, 1 + (rand() % 6));
            }
            FILE *lf = fopen("%TEMP%\\ultimate_chaos_log.tmp", "a");
            if (lf) { fprintf(lf, "Chaos event at iter %d\n", iteration); fclose(lf); }
        }
    }
    // Ensure final bar
    show_progress_bar(prefix, total, total, bar_width);
    printf("\n");
    Beep(600, 90);
    char msg[512];
    snprintf(msg, sizeof(msg), "%s complete.\nClick OK to continue.", phase_name);
    MessageBoxA(NULL, msg, "Ultimate CHAOS - Phase Complete", MB_OK | MB_ICONINFORMATION);
    return iteration;
}

int main(void) {
    srand((unsigned int)time(NULL));
    /* Determine user profile path */
    char userprofile[MAX_PATH_LEN];
    size_t len = GetEnvironmentVariableA("USERPROFILE", userprofile, MAX_PATH_LEN);
    if (len == 0) {
        // fallback to HOMEDRIVE+HOMEPATH
        char hd[MAX_PATH_LEN], hp[MAX_PATH_LEN];
        GetEnvironmentVariableA("HOMEDRIVE", hd, MAX_PATH_LEN);
        GetEnvironmentVariableA("HOMEPATH", hp, MAX_PATH_LEN);
        snprintf(userprofile, MAX_PATH_LEN, "%s%s", hd, hp);
    }
    /* Project root */
    char projectRoot[MAX_PATH_LEN];
    join_path(projectRoot, userprofile, "Ultimate_CHAOS_Project");
    ensure_dir(projectRoot);
    /* Create subfolders */
    const char *subfolders[] = {
        "bin","logs","configs","scripts","assets","docs","temp","installers","examples",
        "loot","mods","patches","ui","levels","sounds","recipes","data","archives","cache"
    };
    int sfcount = sizeof(subfolders)/sizeof(subfolders[0]);
    char ppath[MAX_PATH_LEN];
    for (int i = 0; i < sfcount; ++i) {
        join_path(ppath, projectRoot, subfolders[i]);
        ensure_dir(ppath);
    }
    /* Create README and notes */
    char readme[MAX_PATH_LEN];
    join_path(readme, projectRoot, "README.md");
    FILE *r = fopen(readme, "w");
    if (r) {
        fprintf(r, "# Ultimate_CHAOS_Project\nGenerated by Ultimate_CHAOS.exe\nLook in this folder for generated files.\n");
        fclose(r);
    }
    /* Create many random files (~60) */
    printf("Generating example files...\n");
    for (int i = 0; i < 60; ++i) {
        const char *folder = subfolders[i % sfcount];
        char folderPath[MAX_PATH_LEN];
        join_path(folderPath, projectRoot, folder);
        char fname[MAX_PATH_LEN];
        snprintf(fname, sizeof(fname), "%s\\file_%03d_%d.bin", folderPath, i+1, rand()%10000);
        create_random_file(fname, 1 + (rand() % 20));
    }
    /* basic log */
    char logpath[MAX_PATH_LEN];
    join_path(logpath, projectRoot, "logs\\chaos_setup.log");
    FILE *logf = fopen(logpath, "a");
    if (logf) {
        time_t t = time(NULL);
        fprintf(logf, "Ultimate CHAOS started at %s\n", ctime(&t));
        fclose(logf);
    }

    /* Show hacker header */
    set_color(FOREGROUND_GREEN | FOREGROUND_INTENSITY);
    printf("╔════════════════════════════════════════════════════════════════╗\n");
    printf("║    ULTIMATE  —  CHAOS  SETUP  —  HACKER-TERMINAL + WIZARD UI    ║\n");
    printf("╚════════════════════════════════════════════════════════════════╝\n\n");
    set_color(FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE);
    printf("Booting virtual modules...");
    spinner(800);
    printf("\n");

    /* Define phases similar to PS1 version */
    struct Phase { const char *name; double gb; double inc_mb; double delay_s; int width; };
    struct Phase phases[] = {
        {"Phase 1 - Boot Sequence (Hacker)", 0.6, 4.0, 0.25, 60},
        {"Phase 2 - Installer Core (Windows)", 0.9, 5.0, 0.28, 60},
        {"Phase 3 - Game Assets (Loot & Models)", 1.2, 6.0, 0.30, 60},
        {"Phase 4 - Chaos Sync (Glitch)", 0.8, 3.5, 0.22, 60},
        {"Phase 5 - Finalizer & Patch (Wizard)", 0.5, 2.5, 0.20, 60}
    };
    int nph = sizeof(phases)/sizeof(phases[0]);
    double XP = 0.0;
    int Level = 1;

    /* Run phases */
    for (int p = 0; p < nph; ++p) {
        run_phase(phases[p].name, phases[p].gb, phases[p].inc_mb, phases[p].delay_s, phases[p].width, projectRoot, &XP, &Level);
    }

    /* Create loot files */
    const char *lootNames[] = {"Obsidian_Shard","Quantum_Core","Neon_Circuit","LuckyCharm","Beta_Patch"};
    for (int i = 0; i < 16; ++i) {
        char lpath[MAX_PATH_LEN];
        snprintf(lpath, sizeof(lpath), "%s\\loot\\%s_%d.loot", projectRoot, lootNames[i % 5], rand()%100000);
        create_random_file(lpath, 2 + (rand()%48));
    }

    /* Create levels files */
    for (int lvl = 1; lvl <= 12; ++lvl) {
        char lfile[MAX_PATH_LEN];
        snprintf(lfile, sizeof(lfile), "%s\\levels\\level_%d.json", projectRoot, lvl);
        FILE *lf = fopen(lfile, "w");
        if (lf) {
            fprintf(lf, "{ \"level\": %d, \"xpRequired\": %d, \"reward\": \"Reward_%d\" }\n", lvl, lvl*100, lvl);
            fclose(lf);
        }
    }

    /* Simulated validation */
    printf("\n[ Installer Wizard ]\n");
    printf("Steps:\n 1) Validate virtual signature\n 2) Extract assets\n 3) Apply patches\n 4) Finalize\n");
    spinner(900);
    printf("\nValidating virtual signature...\n");
    for (int i = 0; i < 6; ++i) { Beep(600 + rand()%500, 60); msleep(80); }
    printf("Signature OK.\n");

    /* Possible micro-patch: create more temp files */
    if ((rand() % 100) < 40) {
        printf("\nApplying emergency micro-patch...\n");
        for (int j = 0; j < 8; ++j) {
            char tmpf[MAX_PATH_LEN];
            snprintf(tmpf, sizeof(tmpf), "%s\\temp\\patch_%d.tmp", projectRoot, rand()%1000000);
            create_random_file(tmpf, 1 + (rand()%8));
        }
        printf("Micro-patch applied.\n");
    }

    /* Final XP bonus */
    double bonusXP = (rand() % 36) + 12;
    XP += bonusXP;
    while (XP >= Level * 100.0) {
        XP -= Level * 100.0;
        Level++;
    }

    /* Achievements simple */
    int achCount = 0;
    if (Level >= 3) achCount++;
    // count files roughly by walking folders not necessary here; estimate created
    int createdFilesEstimate = 60 + 16 + 12 + 10;
    if (createdFilesEstimate >= 80) achCount++;

    /* Finalize: write marker and summary */
    char marker[MAX_PATH_LEN];
    join_path(marker, projectRoot, "INSTALL_COMPLETE.txt");
    FILE *mf = fopen(marker, "w");
    if (mf) {
        fprintf(mf, "Install completed at %sLevel %d XP %.2f\n", ctime((const time_t[]){time(NULL)}), Level, XP);
        fclose(mf);
    }
    char summary[MAX_PATH_LEN];
    join_path(summary, projectRoot, "setup_summary.txt");
    FILE *sf = fopen(summary, "w");
    if (sf) {
        fprintf(sf, "Ultimate_CHAOS Setup Summary\nGenerated at: %s\nProject root: %s\nFiles created (estimate): %d\nLevel: %d XP: %.2f\nAchievements: %d\n",
            ctime((const time_t[]){time(NULL)}), projectRoot, createdFilesEstimate, Level, XP, achCount);
        fclose(sf);
    }

    /* Confetti & fanfare */
    set_color(FOREGROUND_INTENSITY | FOREGROUND_BLUE);
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 60; ++c) {
            char chs[] = "@#$%*+~!";
            putchar(chs[rand() % (sizeof(chs)-1)]);
        }
        putchar('\n');
        msleep(90);
    }
    set_color(FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE);
    // melody
    int melody[] = {440, 523, 659, 880};
    for (int i = 0; i < 4; ++i) { Beep(melody[i], 80); msleep(60); }

    /* Show final MessageBox and print console summary */
    char finalMsg[512];
    snprintf(finalMsg, sizeof(finalMsg), "Ultimate CHAOS setup finished successfully.\nLevel: %d\nXP: %.2f\nOpen folder: %s", Level, XP, projectRoot);
    MessageBoxA(NULL, finalMsg, "Ultimate CHAOS - Done", MB_OK | MB_ICONINFORMATION);

    printf("\n========================================\n");
    printf("ULTIMATE CHAOS SETUP COMPLETE!\nProject root: %s\nFiles created (estimate): %d\nLevel: %d  XP: %.2f\nAchievements (count): %d\n",
        projectRoot, createdFilesEstimate, Level, XP, achCount);
    printf("========================================\n");

    return 0;
}
