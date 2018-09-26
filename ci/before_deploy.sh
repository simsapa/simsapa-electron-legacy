echo "=== before_deploy.sh ==="

echo "OS: '$TRAVIS_OS_NAME'"

if [ -d out/ ]
then
    ls -lhR out/
else
    echo "Doesn't exist: ./out"
fi
