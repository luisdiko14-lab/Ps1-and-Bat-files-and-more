@echo off
set OUT=path_dump.txt
(for %%p in (%PATH:;= %) do @echo %%p)>"%OUT%"
echo Wrote %OUT%
