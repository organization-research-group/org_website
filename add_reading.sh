set -e

FRIDAYS=`
for i in {-3..3}
	do date --date="this friday + $i weeks" +%Y-%m-%d
done
`

select CHOICE in $FRIDAYS;
do
		vim readings/$CHOICE.html;
		break;
done
