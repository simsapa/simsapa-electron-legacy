echo "=== before_deploy.sh ==="

echo "OS: '$TRAVIS_OS_NAME'"

if [ -d out/make/ ]
then
    ls -lh out/make/
else
    echo "Doesn't exist: ./out/make/"
fi
