#!/bin/sh
# husky shell script

# skip in CI environments
[ -n "$CI" ] && exit 0

# change to project root
cd "$(dirname "$0")/../.." || exit 1

# run the hook
. "$(dirname "$0")/$(basename "$0")"
