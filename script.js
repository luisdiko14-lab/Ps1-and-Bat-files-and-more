const downloadBtn = document.getElementById("downloadBtn");
const viewRepoBtn = document.getElementById("viewRepo");
const compatibilityBtn = document.getElementById("compatibility");
const exploreFilesBtn = document.getElementById("exploreFiles");
const loader = document.getElementById("loader");
const filesSection = document.getElementById("filesSection");
const fileList = document.getElementById("fileList");

// Typewriter effect
function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.textContent = '';
  element.classList.add('typewriter-cursor');
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      element.classList.remove('typewriter-cursor');
    }
  }
  type();
}

// Initialize typewriter on page load
document.addEventListener('DOMContentLoaded', () => {
  const h1 = document.getElementById('typewriter');
  const originalText = h1.textContent;
  typeWriter(h1, originalText);
});

// Helper function to show loader briefly
function handleClick(url) {
  loader.classList.remove("hidden");
  setTimeout(() => {
    window.location.href = url;
    loader.classList.add("hidden");
  }, 2000); // reduced to 2 seconds
}

downloadBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more");
});

viewRepoBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more");
});

compatibilityBtn.addEventListener("click", () => {
  handleClick("https://github.com/luisdiko14-lab/Ps1-and-Bat-files-and-more/blob/main/compatibility.md");
});

// Explore files button
exploreFilesBtn.addEventListener("click", () => {
  if (filesSection.classList.contains("hidden")) {
    populateFileList();
    filesSection.classList.remove("hidden");
    filesSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    filesSection.classList.add("hidden");
  }
});

// Populate file list
function populateFileList() {
  const files = [
    // Root files
    { name: "compatibility.md", type: "Markdown", description: "Compatibility information for scripts" },
    { name: "create_files.sh", type: "Shell Script", description: "Script to create files" },
    { name: "files.json", type: "JSON", description: "File configuration" },
    { name: "home.tsx", type: "TypeScript React", description: "Home component" },
    { name: "index.html", type: "HTML", description: "Main webpage" },
    { name: "info.yml", type: "YAML", description: "Information file" },
    { name: "LICENSE", type: "License", description: "Repository license" },
    { name: "LINCENSE_in_md.md", type: "Markdown", description: "License in markdown" },
    { name: "pack-locker.jsons", type: "JSON", description: "Package locker configuration" },
    { name: "package.json", type: "JSON", description: "Node.js package configuration" },
    { name: "package-lock.json", type: "JSON", description: "Node.js lock file" },
    { name: "README.md", type: "Markdown", description: "Repository readme" },
    { name: "script.js", type: "JavaScript", description: "Main script" },
    { name: "SECURITY.md", type: "Markdown", description: "Security information" },
    { name: "style.css", type: "CSS", description: "Stylesheet" },
    { name: "Use_VM_for_testing.md", type: "Markdown", description: "VM testing guide" },
    { name: "Web.Info.md", type: "Markdown", description: "Web information" },
    { name: ".gitignore", type: "Git Ignore", description: "Git ignore file" },
    // Cool Folder With Files (sample of many)
    { name: "Cool Folder With Files/adventure_game.bat", type: "Batch", description: "Adventure game script" },
    { name: "Cool Folder With Files/animated_text.ps1", type: "PowerShell", description: "Animated text effect" },
    { name: "Cool Folder With Files/append-log.bat", type: "Batch", description: "Log appending script" },
    { name: "Cool Folder With Files/bulk_rename.bat", type: "Batch", description: "Bulk file rename" },
    { name: "Cool Folder With Files/chaos_cmode.rb", type: "Ruby", description: "Chaos console mode" },
    { name: "Cool Folder With Files/colorfull_progrees_bar.ps1", type: "PowerShell", description: "Colorful progress bar" },
    { name: "Cool Folder With Files/Control_Center.bat", type: "Batch", description: "Control center script" },
    { name: "Cool Folder With Files/cool.ts", type: "TypeScript", description: "Cool TypeScript file" },
    { name: "Cool Folder With Files/CoolSetup.ps1", type: "PowerShell", description: "Cool setup script" },
    { name: "Cool Folder With Files/countdown_with_sound_alarm.bat", type: "Batch", description: "Countdown with alarm" },
    { name: "Cool Folder With Files/digital_rain.c", type: "C", description: "Digital rain effect" },
    { name: "Cool Folder With Files/disk_summary.bat", type: "Batch", description: "Disk summary" },
    { name: "Cool Folder With Files/dont_run_me.bat", type: "Batch", description: "Dangerous script - don't run" },
    { name: "Cool Folder With Files/doomsday.bat", type: "Batch", description: "Doomsday script" },
    { name: "Cool Folder With Files/Echo.bat", type: "Batch", description: "Echo script" },
    { name: "Cool Folder With Files/error.bat", type: "Batch", description: "Error handling script" },
    { name: "Cool Folder With Files/explorer_killer.bat", type: "Batch", description: "Explorer killer" },
    { name: "Cool Folder With Files/fake_system_scanner.py", type: "Python", description: "Fake system scanner" },
    { name: "Cool Folder With Files/fake_virus_prank.bat", type: "Batch", description: "Fake virus prank" },
    { name: "Cool Folder With Files/filehash.bat", type: "Batch", description: "File hash calculator" },
    { name: "Cool Folder With Files/Folder_Watcher.ps1", type: "PowerShell", description: "Folder watcher" },
    { name: "Cool Folder With Files/gov_terminal.bat", type: "Batch", description: "Government terminal simulation" },
    { name: "Cool Folder With Files/idk.bat", type: "Batch", description: "Unknown script" },
    { name: "Cool Folder With Files/InteractiveToolkit.ps1", type: "PowerShell", description: "Interactive toolkit" },
    { name: "Cool Folder With Files/matrix_console.bat", type: "Batch", description: "Matrix console" },
    { name: "Cool Folder With Files/matrix_rain_effect.bat", type: "Batch", description: "Matrix rain effect" },
    { name: "Cool Folder With Files/My_Cool_File.bat", type: "Batch", description: "Cool batch file" },
    { name: "Cool Folder With Files/My_Probaly_Not_Working_Script.bat", type: "Batch", description: "Probably not working script" },
    { name: "Cool Folder With Files/Name.py", type: "Python", description: "Name script" },
    { name: "Cool Folder With Files/no_escape_virus_keys.reg", type: "Registry", description: "No escape virus keys" },
    { name: "Cool Folder With Files/open_sites_menu.bat", type: "Batch", description: "Open sites menu" },
    { name: "Cool Folder With Files/pc_repair.bat", type: "Batch", description: "PC repair script" },
    { name: "Cool Folder With Files/ping_monitor_2.bat", type: "Batch", description: "Ping monitor" },
    { name: "Cool Folder With Files/popup_reminder.ps1", type: "PowerShell", description: "Popup reminder" },
    { name: "Cool Folder With Files/Progress_bar_with_copy.ps1", type: "PowerShell", description: "Progress bar with copy" },
    { name: "Cool Folder With Files/quick_backup_for_a_folder.ps1", type: "PowerShell", description: "Quick folder backup" },
    { name: "Cool Folder With Files/random_password_generator.bat", type: "Batch", description: "Random password generator" },
    { name: "Cool Folder With Files/retro_os.bat", type: "Batch", description: "Retro OS simulation" },
    { name: "Cool Folder With Files/robot_control.bat", type: "Batch", description: "Robot control" },
    { name: "Cool Folder With Files/scaffold_project.bat", type: "Batch", description: "Project scaffolding" },
    { name: "Cool Folder With Files/Shutdown_with_phases.bat", type: "Batch", description: "Shutdown with phases" },
    { name: "Cool Folder With Files/Something_Very_Special.bat", type: "Batch", description: "Special script" },
    { name: "Cool Folder With Files/Something_Very_Special.ps1", type: "PowerShell", description: "Special PowerShell script" },
    { name: "Cool Folder With Files/spinner.rb", type: "Ruby", description: "Spinner animation" },
    { name: "Cool Folder With Files/Super_Cool_File.py", type: "Python", description: "Super cool Python file" },
    { name: "Cool Folder With Files/system_info.ps1", type: "PowerShell", description: "System info" },
    { name: "Cool Folder With Files/System_Tool.bat", type: "Batch", description: "System tool" },
    { name: "Cool Folder With Files/System.sys.ps1", type: "PowerShell", description: "System script" },
    { name: "Cool Folder With Files/temp_files_cleaner.bat", type: "Batch", description: "Temp files cleaner" },
    { name: "Cool Folder With Files/TextScript.ts", type: "TypeScript", description: "Text script" },
    { name: "Cool Folder With Files/THE MEGA C-MODE CHAOS SYSTEM — TypeScript Edition.ts", type: "TypeScript", description: "Mega chaos system" },
    { name: "Cool Folder With Files/Ultimate_CHAOS_Setup.ps1", type: "PowerShell", description: "Ultimate chaos setup" },
    { name: "Cool Folder With Files/Ultimate_CHAOS.c", type: "C", description: "Ultimate chaos in C" },
    { name: "Cool Folder With Files/website_ping_monitor.ps1", type: "PowerShell", description: "Website ping monitor" },
    { name: "Cool Folder With Files/win98.bat", type: "Batch", description: "Windows 98 simulation" },
    { name: "Cool Folder With Files/zip_folder.bat", type: "Batch", description: "Zip folder script" },
    // Files in files/ folder (sample)
    { name: "files/AdapterSpeedViewPlus.ps1", type: "PowerShell", description: "Adapter speed view" },
    { name: "files/ApiGetTemplate.ps1", type: "PowerShell", description: "API get template" },
    { name: "files/AsciiBannerMakerPlus.ps1", type: "PowerShell", description: "ASCII banner maker" },
    { name: "files/BatteryHealthCheck.ps1", type: "PowerShell", description: "Battery health check" },
    { name: "files/COOL_COLLECTION_INDEX.md", type: "Markdown", description: "Cool collection index" },
    { name: "files/CPUInfoView.bat", type: "Batch", description: "CPU info view" },
    { name: "files/CalendarWeekViewPlus.ps1", type: "PowerShell", description: "Calendar week view" },
    { name: "files/CertificateStorePeekLite.ps1", type: "PowerShell", description: "Certificate store peek" },
    { name: "files/CleanEmptyFolders.bat", type: "Batch", description: "Clean empty folders" },
    { name: "files/ClipboardHistoryLite.ps1", type: "PowerShell", description: "Clipboard history" },
    { name: "files/ColorConsoleDemo.ps1", type: "PowerShell", description: "Color console demo" },
    { name: "files/ComputerInfoMiniPlus.ps1", type: "PowerShell", description: "Computer info mini" },
    { name: "files/ConfigTemplateWriter.ps1", type: "PowerShell", description: "Config template writer" },
    { name: "files/CountdownTimer.bat", type: "Batch", description: "Countdown timer" },
    { name: "files/CsvColumnPeek.ps1", type: "PowerShell", description: "CSV column peek" },
    { name: "files/CurrentUserProfilePlus.ps1", type: "PowerShell", description: "Current user profile" },
    { name: "files/DateRangeGeneratorNice.ps1", type: "PowerShell", description: "Date range generator" },
    { name: "files/DirectoryWatcher.ps1", type: "PowerShell", description: "Directory watcher" },
    { name: "files/DiskFreeTop.ps1", type: "PowerShell", description: "Disk free top" },
    { name: "files/DiskUsageSummary.bat", type: "Batch", description: "Disk usage summary" },
    { name: "files/DnsCachePeekLite.ps1", type: "PowerShell", description: "DNS cache peek" },
    { name: "files/DuplicateFileFinder.ps1", type: "PowerShell", description: "Duplicate file finder" },
    { name: "files/EmptyFileFinderPlus.ps1", type: "PowerShell", description: "Empty file finder" },
    { name: "files/EnvInspector.ps1", type: "PowerShell", description: "Environment inspector" },
    { name: "files/EnvSnapshot.bat", type: "Batch", description: "Environment snapshot" },
    { name: "files/EventLogQuickView.ps1", type: "PowerShell", description: "Event log quick view" },
    { name: "files/ExtensionSummaryPlus.ps1", type: "PowerShell", description: "Extension summary" },
    { name: "files/FastBackupMirror.bat", type: "Batch", description: "Fast backup mirror" },
    { name: "files/FileAgeBuckets.ps1", type: "PowerShell", description: "File age buckets" },
    { name: "files/FileNameNormalizerPreview.ps1", type: "PowerShell", description: "File name normalizer" },
    { name: "files/FileOrganizerByExt.bat", type: "Batch", description: "File organizer by extension" },
    { name: "files/FolderCatalogMaker.ps1", type: "PowerShell", description: "Folder catalog maker" },
    { name: "files/FolderSizeReport.ps1", type: "PowerShell", description: "Folder size report" },
    { name: "files/FolderTreeExport.bat", type: "Batch", description: "Folder tree export" },
    { name: "files/GitQuickStatus.bat", type: "Batch", description: "Git quick status" },
    { name: "files/GitRepoQuickAudit.ps1", type: "PowerShell", description: "Git repo quick audit" },
    { name: "files/GuidGeneratorSetPlus.ps1", type: "PowerShell", description: "GUID generator set" },
    { name: "files/HexColorPalettePlus.ps1", type: "PowerShell", description: "Hex color palette" },
    { name: "files/HostsFilePreviewLite.ps1", type: "PowerShell", description: "Hosts file preview" },
    { name: "files/HttpStatusCheck.ps1", type: "PowerShell", description: "HTTP status check" },
    { name: "files/JsonArrayCounter.ps1", type: "PowerShell", description: "JSON array counter" },
    { name: "files/JsonPrettyPrint.ps1", type: "PowerShell", description: "JSON pretty print" },
    { name: "files/LargeFileScanner.ps1", type: "PowerShell", description: "Large file scanner" },
    { name: "files/LogTailViewerLite.ps1", type: "PowerShell", description: "Log tail viewer" },
    { name: "files/ManifestEntryBuilder.ps1", type: "PowerShell", description: "Manifest entry builder" },
    { name: "files/MarkdownLinkListPlus.ps1", type: "PowerShell", description: "Markdown link list" },
    { name: "files/MemoryInfoView.bat", type: "Batch", description: "Memory info view" },
    { name: "files/NetworkDiagnostics.ps1", type: "PowerShell", description: "Network diagnostics" },
    { name: "files/NetworkProfileViewPlus.ps1", type: "PowerShell", description: "Network profile view" },
    { name: "files/NetworkResetHints.bat", type: "Batch", description: "Network reset hints" },
    { name: "files/NotesAppender.bat", type: "Batch", description: "Notes appender" },
    { name: "files/OpenCommonToolsMenu.bat", type: "Batch", description: "Open common tools menu" },
    { name: "files/PathLengthChecker.ps1", type: "PowerShell", description: "Path length checker" },
    { name: "files/PingLatencyAveragePlus.ps1", type: "PowerShell", description: "Ping latency average" },
    { name: "files/PortCheckNetstat.bat", type: "Batch", description: "Port check netstat" },
    { name: "files/PortListenerReportPlus.ps1", type: "PowerShell", description: "Port listener report" },
    { name: "files/PowerPlanSwitcher.ps1", type: "PowerShell", description: "Power plan switcher" },
    { name: "files/ProcessCpuPulse.ps1", type: "PowerShell", description: "Process CPU pulse" },
    { name: "files/ProcessStartTimesPlus.ps1", type: "PowerShell", description: "Process start times" },
    { name: "files/ProcessTopMemory.ps1", type: "PowerShell", description: "Process top memory" },
    { name: "files/ProfileBackupHelperLite.ps1", type: "PowerShell", description: "Profile backup helper" },
    { name: "files/ProgressBarDemoNicePlus.ps1", type: "PowerShell", description: "Progress bar demo" },
    { name: "files/QuickHashFile.bat", type: "Batch", description: "Quick hash file" },
    { name: "files/QuickNotesJsonPlus.ps1", type: "PowerShell", description: "Quick notes JSON" },
    { name: "files/QuickPingSweep.bat", type: "Batch", description: "Quick ping sweep" },
    { name: "files/QuickSystemReport.ps1", type: "PowerShell", description: "Quick system report" },
    { name: "files/RandomFactsPackPlus.ps1", type: "PowerShell", description: "Random facts pack" },
    { name: "files/RandomPasswordNice.ps1", type: "PowerShell", description: "Random password nice" },
    { name: "files/RandomQuote.bat", type: "Batch", description: "Random quote" },
    { name: "files/RecentFilesDigest.ps1", type: "PowerShell", description: "Recent files digest" },
    { name: "files/RegistryValueReaderLite.ps1", type: "PowerShell", description: "Registry value reader" },
    { name: "files/ReportTimestampMaker.ps1", type: "PowerShell", description: "Report timestamp maker" },
    { name: "files/RouteTableLitePlus.ps1", type: "PowerShell", description: "Route table lite" },
    { name: "files/SafeDeletePrompt.bat", type: "Batch", description: "Safe delete prompt" },
    { name: "files/ScheduleTaskCreatorLite.ps1", type: "PowerShell", description: "Schedule task creator" },
    { name: "files/ScriptInventoryViewPlus.ps1", type: "PowerShell", description: "Script inventory view" },
    { name: "files/ServiceRestartSafe.ps1", type: "PowerShell", description: "Service restart safe" },
    { name: "files/ServiceStateMatrix.ps1", type: "PowerShell", description: "Service state matrix" },
    { name: "files/ServiceStatusSnapshot.ps1", type: "PowerShell", description: "Service status snapshot" },
    { name: "files/ShareFolderViewLite.ps1", type: "PowerShell", description: "Share folder view" },
    { name: "files/SimpleHttpDownloadLite.ps1", type: "PowerShell", description: "Simple HTTP download" },
    { name: "files/StartupCommandPeekLite.ps1", type: "PowerShell", description: "Startup command peek" },
    { name: "files/SystemUptimeQuick.bat", type: "Batch", description: "System uptime quick" },
    { name: "files/TempCleanerLite.ps1", type: "PowerShell", description: "Temp cleaner lite" },
    { name: "files/TempUsageReportPlus.ps1", type: "PowerShell", description: "Temp usage report" },
    { name: "files/TextSearchPreview.ps1", type: "PowerShell", description: "Text search preview" },
    { name: "files/TimerStopwatchLitePlus.ps1", type: "PowerShell", description: "Timer stopwatch lite" },
    { name: "files/TodoListManager.bat", type: "Batch", description: "Todo list manager" },
    { name: "files/TodoSummaryBoardPlus.ps1", type: "PowerShell", description: "Todo summary board" },
    { name: "files/TopCommandsHistoryLite.ps1", type: "PowerShell", description: "Top commands history" },
    { name: "files/UltimateSystemUtility_v25_Quantum.ps1", type: "PowerShell", description: "Ultimate system utility" },
    { name: "files/UptimeReportPlus.ps1", type: "PowerShell", description: "Uptime report" },
    { name: "files/WelcomeBanner.txt", type: "Text", description: "Welcome banner" },
    { name: "files/ZipLogsArchive.ps1", type: "PowerShell", description: "Zip logs archive" },
    { name: "files/append_timestamp_note_plus.bat", type: "Batch", description: "Append timestamp note" },
    { name: "files/ascii_art_hi_plus.bat", type: "Batch", description: "ASCII art hi" },
    { name: "files/batch_color_presets_plus.bat", type: "Batch", description: "Batch color presets" },
    { name: "files/branch_name_echo_plus.bat", type: "Batch", description: "Branch name echo" },
    { name: "files/calc_helper.py", type: "Python", description: "Calc helper" },
    { name: "files/calc_sum_args_plus.bat", type: "Batch", description: "Calc sum args" },
    { name: "files/clock_display_plus.bat", type: "Batch", description: "Clock display" },
    { name: "files/compare_strings_plus.bat", type: "Batch", description: "Compare strings" },
    { name: "files/copy_with_timestamp_plus.bat", type: "Batch", description: "Copy with timestamp" },
    { name: "files/csv_preview_plus.bat", type: "Batch", description: "CSV preview" },
    { name: "files/demo_manifest_template.json", type: "JSON", description: "Demo manifest template" },
    { name: "files/dir_snapshot_to_file_plus.bat", type: "Batch", description: "Dir snapshot to file" },
    { name: "files/drive_free_report_plus.bat", type: "Batch", description: "Drive free report" },
    { name: "files/echo_box_plus.bat", type: "Batch", description: "Echo box" },
    { name: "files/empty_file_check_plus.bat", type: "Batch", description: "Empty file check" },
    { name: "files/extension_count_plus.bat", type: "Batch", description: "Extension count" },
    { name: "files/extension_move_preview_plus.bat", type: "Batch", description: "Extension move preview" },
    { name: "files/fancy_separator_plus.bat", type: "Batch", description: "Fancy separator" },
    { name: "files/file_exists_check_plus.bat", type: "Batch", description: "File exists check" },
    { name: "files/files_counter_plus.bat", type: "Batch", description: "Files counter" },
    { name: "files/folder_size_hint_plus.bat", type: "Batch", description: "Folder size hint" },
    { name: "files/guid_like_string_plus.bat", type: "Batch", description: "GUID like string" },
    { name: "files/history_log_stub_plus.bat", type: "Batch", description: "History log stub" },
    { name: "files/ip_ping_combo_plus.bat", type: "Batch", description: "IP ping combo" },
    { name: "files/json_backup_plus.bat", type: "Batch", description: "JSON backup" },
    { name: "files/line_count_report_plus.bat", type: "Batch", description: "Line count report" },
    { name: "files/list_hidden_files_plus.bat", type: "Batch", description: "List hidden files" },
    { name: "files/make_demo_log_plus.bat", type: "Batch", description: "Make demo log" },
    { name: "files/make_json_stub_plus.bat", type: "Batch", description: "Make JSON stub" },
    { name: "files/make_readme_stub_plus.bat", type: "Batch", description: "Make README stub" },
    { name: "files/make_temp_workspace_plus.bat", type: "Batch", description: "Make temp workspace" },
    { name: "files/markdown_todo_template_plus.bat", type: "Batch", description: "Markdown todo template" },
    { name: "files/menu_demo_tools_plus.bat", type: "Batch", description: "Menu demo tools" },
    { name: "files/net_info_card_plus.bat", type: "Batch", description: "Net info card" },
    { name: "files/open_url_hint_plus.bat", type: "Batch", description: "Open URL hint" },
    { name: "files/other_Powershell_files/", type: "Directory", description: "Other PowerShell files folder" },
    { name: "files/path_dump_plus.bat", type: "Batch", description: "Path dump" },
    { name: "files/port_probe_hint_plus.bat", type: "Batch", description: "Port probe hint" },
    { name: "files/project_scaffold_mini_plus.bat", type: "Batch", description: "Project scaffold mini" },
    { name: "files/random_color_echo_plus.bat", type: "Batch", description: "Random color echo" },
    { name: "files/recent_dir_list_plus.bat", type: "Batch", description: "Recent dir list" },
    { name: "files/rename_spaces_preview_plus.bat", type: "Batch", description: "Rename spaces preview" },
    { name: "files/repo_last_commit_plus.bat", type: "Batch", description: "Repo last commit" },
    { name: "files/reverse_args_echo_plus.bat", type: "Batch", description: "Reverse args echo" },
    { name: "files/sample_tasks.todo.md", type: "Markdown", description: "Sample tasks todo" },
    { name: "files/service_query_card_plus.bat", type: "Batch", description: "Service query card" },
    { name: "files/show_errorlevel_demo_plus.bat", type: "Batch", description: "Show errorlevel demo" },
    { name: "files/simple_alarm_beep_plus.bat", type: "Batch", description: "Simple alarm beep" },
    { name: "files/sysinfo_mini_plus.bat", type: "Batch", description: "Sysinfo mini" },
    { name: "files/tasklist_filter_plus.bat", type: "Batch", description: "Tasklist filter" },
    { name: "files/temp_count_plus.bat", type: "Batch", description: "Temp count" },
    { name: "files/text_search_all_plus.bat", type: "Batch", description: "Text search all" },
    { name: "files/toolbox_notes.md", type: "Markdown", description: "Toolbox notes" },
    { name: "files/username_card_plus.bat", type: "Batch", description: "Username card" },
    { name: "files/weekday_echo_plus.bat", type: "Batch", description: "Weekday echo" },
    // Python bot files
    { name: "python_bot/README.md", type: "Markdown", description: "Python bot readme" },
    { name: "python_bot/run.sh", type: "Shell Script", description: "Run script for bot" },
    { name: "python_bot/main.py", type: "Python", description: "Main bot script" },
    { name: "python_bot/requirements.txt", type: "Text", description: "Requirements for bot" },
    { name: "python_bot/cogs/general.py", type: "Python", description: "General cog" },
    { name: "python_bot/cogs/music.py", type: "Python", description: "Music cog" },
    { name: "python_bot/cogs/moderation.py", type: "Python", description: "Moderation cog" },
    // License files
    { name: "license-files/LICENSE", type: "License", description: "License file" },
    { name: "license-files/LICENSE.md", type: "Markdown", description: "License in markdown" },
    // Other folders mentioned
    { name: "MEGA_ULTRA_FOLDER/", type: "Directory", description: "Mega ultra folder" },
    { name: "generated_files/", type: "Directory", description: "Generated files folder" },
    { name: "node_modules/", type: "Directory", description: "Node.js modules" },
    { name: ".git/", type: "Directory", description: "Git repository" },
    { name: ".github/", type: "Directory", description: "GitHub configuration" },
    { name: ".venv/", type: "Directory", description: "Python virtual environment" },
    { name: "ThingThatSaysHello/", type: "Directory", description: "Hello folder" },
    // Note: This is a comprehensive sample. The repo has 308+ files total.
  ];

  fileList.innerHTML = '';
  files.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div>
        <span class="file-name">${file.name}</span>
        <div class="file-type">${file.type}</div>
      </div>
      <div>${file.description}</div>
    `;
    fileList.appendChild(fileItem);
  });
}
