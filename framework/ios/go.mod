module github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy/ios

go 1.13

require (
	github.com/BurntSushi/toml v0.3.1
	github.com/google/flatbuffers v1.11.0
	github.com/jedisct1/dlog v0.0.0-20190909160351-692385b00b84
	github.com/jedisct1/dnscrypt-proxy v0.0.0
	github.com/jedisct1/go-dnsstamps v0.0.0-20191014084838-3e6e00f2b602
	github.com/miekg/dns v1.1.22
	gopkg.in/natefinch/lumberjack.v2 v2.0.0
)

replace github.com/jedisct1/dnscrypt-proxy => ../..
