import NetworkExtension
import Dnscryptproxy

@objc(CordovaDnstool) class CordovaDnstool : CDVPlugin {
    
    var vpnStatusObserver: NSObjectProtocol?
    private lazy var vpnStatusObserverSet: Bool = {
        return false
    }()
    
    @objc(fileExists:)
    func fileExists(command: CDVInvokedUrlCommand) {
        let path = command.arguments[0] as? String ?? ""
        
        let fileManager = FileManager.default
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: fileManager.fileExists(atPath: path)
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(fetchLists:)
    func fetchLists(command: CDVInvokedUrlCommand) {
        let defaultResolver = command.arguments[0] as? String ?? "9.9.9.9:53"
        let ignoreSystemDNS = command.arguments[1] as? Bool ?? false
        let lists = command.arguments[2] as? [String] ?? [String]()
        
        var hasIPv4 = false;
        var hasIPv6 = false;
        
        let netStatus = NetTester.status()
        
        if (netStatus == NET_TESTER_IPV6_CONN) {
            hasIPv6 = true;
        } else if (netStatus == NET_TESTER_DUAL_CONN) {
            hasIPv6 = true;
            hasIPv4 = true;
        } else {
            hasIPv4 = true;
        }
        
        lists.forEach { list in
            let url_cache = list.components(separatedBy: "|")
            DnscryptproxyPrefetchSourceURLCloak(30, hasIPv4, hasIPv6, defaultResolver, ignoreSystemDNS, url_cache[0], url_cache[1], url_cache[2], nil)
        }
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }

    @objc(getGroupDir:)
    func getGroupDir(command: CDVInvokedUrlCommand) {
        let group = command.arguments[0] as? String ?? ""
        
        let appGroupDirectory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)!
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: [
                    "url": appGroupDirectory.absoluteString,
                    "path": appGroupDirectory.path
                ]
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(startExt:)
    func startExt(command: CDVInvokedUrlCommand) {
        let  pluginResult = CDVPluginResult(
            status: CDVCommandStatus_ERROR
        )

        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                let start: (() -> Void) = {
                    do {
                        self.startStatusMonitors()
                        if manager.connection.status == .connected {
                            self.commandDelegate!.evalJs("cordova.fireDocumentEvent('vpn:state:changed', {state: 3});")
                        } else {
                            try manager.connection.startVPNTunnel()
                        }

                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    } catch let error {
                        self.stopStatusMonitors()
                        self.commandDelegate!.send(
                            pluginResult,
                            callbackId: command.callbackId
                        )
                        return print("Error: Could not start manager: \(error)")
                    }
                }
                
                if manager.isEnabled {
                    start()
                } else {
                    manager.isEnabled = true
                    manager.saveToPreferences() { (error) in
                        if let error = error {
                            self.commandDelegate!.send(
                                pluginResult,
                                callbackId: command.callbackId
                            )
                            return print("Error: Could not enable manager: \(error)")
                        }
                        
                        start()
                    }
                }
            }
        }
    }
    
    @objc(stopExt:)
    func stopExt(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                if manager.connection.status != .disconnected {
                    manager.connection.stopVPNTunnel()
                }
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(setupListener:)
    func setupListener(command: CDVInvokedUrlCommand) {
        startStatusMonitors()
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(removeListener:)
    func removeListener(command: CDVInvokedUrlCommand) {
        stopStatusMonitors()
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(getStatus:)
    func getStatus(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: manager.connection.status.rawValue
                    ),
                    callbackId: command.callbackId
                )
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(setSsidExclusions:)
    func setSsidExclusions(command: CDVInvokedUrlCommand) {
        let ssids = command.arguments[0] as? String ?? ""
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                let connectRule = NEOnDemandRuleConnect()
                
                if (ssids == "") {
                    manager.onDemandRules = [connectRule]
                } else {
                    let disconnectRule = NEOnDemandRuleDisconnect()
                    disconnectRule.ssidMatch = ssids.components(separatedBy: "|")
                    manager.onDemandRules = [disconnectRule, connectRule]
                }
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_ERROR
                            ),
                            callbackId: command.callbackId
                        )
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(enableOnDemand:)
    func enableOnDemand(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                manager.isOnDemandEnabled = true
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_ERROR
                            ),
                            callbackId: command.callbackId
                        )
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(disableOnDemand:)
    func disableOnDemand(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                manager.isOnDemandEnabled = false
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_ERROR
                            ),
                            callbackId: command.callbackId
                        )
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(getOnDemand:)
    func getOnDemand(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: manager.isOnDemandEnabled ? 1 : 0
                    ),
                    callbackId: command.callbackId
                )
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: -1 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(enableDisconnectOnSleep:)
    func enableDisconnectOnSleep(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                manager.protocolConfiguration?.disconnectOnSleep = true
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_ERROR
                            ),
                            callbackId: command.callbackId
                        )
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(disableDisconnectOnSleep:)
    func disableDisconnectOnSleep(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                manager.protocolConfiguration?.disconnectOnSleep = false
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_ERROR
                            ),
                            callbackId: command.callbackId
                        )
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(getDisconnectOnSleep:)
    func getDisconnectOnSleep(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: (manager.protocolConfiguration?.disconnectOnSleep)! ? 1 : 0
                    ),
                    callbackId: command.callbackId
                )
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: -1 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(checkPermission:)
    func checkPermission(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            var status: Int;
            if let managers = managers, managers.count > 0 {
                status = 1
            } else {
                status = 2
            }
            
            self.commandDelegate!.send(
                CDVPluginResult(
                    status: CDVCommandStatus_OK,
                    messageAs: status
                ),
                callbackId: command.callbackId
            )
        }
    }
    
    @objc(requestPermission:)
    func requestPermission(command: CDVInvokedUrlCommand) {
        let extId = command.arguments[0] as? String ?? ""
        let title = command.arguments[1] as? String ?? "DNSCloak"
        let group = command.arguments[1] as? String ?? ""
        
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) in
            if let managers = managers, managers.count > 0 {
                NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK
                    ),
                    callbackId: command.callbackId
                )
            } else {
                let config = NETunnelProviderProtocol()
                config.providerConfiguration = ["l": 1]
                config.providerBundleIdentifier = extId
                config.serverAddress = title
                config.disconnectOnSleep = false
                
                let manager = NETunnelProviderManager()
                manager.protocolConfiguration = config
                manager.localizedDescription = title 
                manager.isEnabled = true
                
                let connectRule = NEOnDemandRuleConnect()
                
                let defs = UserDefaults(suiteName: group)
                let ssids = defs?.string(forKey: "ssidExclusions") ?? ""
                if (ssids == "") {
                    manager.onDemandRules = [connectRule]
                } else {
                    let disconnectRule = NEOnDemandRuleDisconnect()
                    disconnectRule.ssidMatch = ssids.components(separatedBy: "|")
                    manager.onDemandRules = [disconnectRule, connectRule]
                }
                
                manager.saveToPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                    } else {
                        NotificationCenter.default.post(name: .NEVPNConfigurationChange, object: nil)
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            }
        }
    }
    
    @objc(removeProfile:)
    func removeProfile(command: CDVInvokedUrlCommand) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                let manager = managers[0]
                
                manager.removeFromPreferences() { (error) -> Void in
                    if let error = error as? NEVPNError, error.code == .configurationReadWriteFailed {
                        
                    } else {
                        self.stopStatusMonitors()
                        self.commandDelegate!.evalJs("cordova.fireDocumentEvent('vpn:state:changed', {state: -1});")
                        
                        self.commandDelegate!.send(
                            CDVPluginResult(
                                status: CDVCommandStatus_OK
                            ),
                            callbackId: command.callbackId
                        )
                    }
                }
            } else {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: 0 //unknown
                    ),
                    callbackId: command.callbackId
                )
            }
        }
    }
    
    @objc(getFileStats:)
    func getFileStats(command: CDVInvokedUrlCommand) {
        let path = command.arguments[0] as? String ?? ""
        let fileManager = FileManager.default
        
        if fileManager.fileExists(atPath: path) {
            do {
                let stats = try fileManager.attributesOfItem(atPath: path)
                let formatter = DateFormatter()
                formatter.locale = Locale.init(identifier: "en_US_POSIX")
                formatter.timeZone = TimeZone.init(secondsFromGMT: 0)
                formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
                
                let out:NSMutableDictionary? = [
                    "createDate": formatter.string(from: stats[FileAttributeKey.creationDate] as! Date),
                    "modifyDate": formatter.string(from: stats[FileAttributeKey.modificationDate] as! Date),
                    "size": stats[FileAttributeKey.size]
                ]
                
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_OK,
                        messageAs: out as! [AnyHashable : Any]
                    ), callbackId: command.callbackId
                )
            } catch {
                self.commandDelegate!.send(
                    CDVPluginResult(
                        status: CDVCommandStatus_ERROR
                    ),
                    callbackId: command.callbackId
                )
            }
        } else {
            self.commandDelegate!.send(
                CDVPluginResult(
                    status: CDVCommandStatus_ERROR
                ),
                callbackId: command.callbackId
            )
        }
    }
    
    @objc(fillPatternlist:)
    func fillPatternlist(command: CDVInvokedUrlCommand) {
        let path = command.arguments[0] as? String ?? ""
        DnscryptproxyFillPatternlistTrees(path, nil);
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(fillIpBlacklist:)
    func fillIpBlacklist(command: CDVInvokedUrlCommand) {
        let path = command.arguments[0] as? String ?? ""
        DnscryptproxyFillIpBlacklistTrees(path, nil);
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK
            ),
            callbackId: command.callbackId
        )
    }
    
    @objc(getConnectivityStatus:)
    func getConnectivityStatus(command: CDVInvokedUrlCommand) {
        let ns = NetTester.status()
        
        self.commandDelegate!.send(
            CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: ns
            ),
            callbackId: command.callbackId
        )
    }
    
    func doWithAppVPNManager(completionHandler: @escaping (NETunnelProviderManager) -> Void) {
        NETunnelProviderManager.loadAllFromPreferences() { (managers, error) -> Void in
            if let managers = managers, managers.count > 0 {
                completionHandler(managers[0])
            }
        }
    }
    
    func startStatusMonitors() {
        guard self.vpnStatusObserver == nil else { return }
        guard !self.vpnStatusObserverSet else { return }
        
        doWithAppVPNManager() { (manager) in
            self.vpnStatusObserverSet = true
            self.vpnStatusObserver = NotificationCenter.default.addObserver(forName: Notification.Name.NEVPNStatusDidChange, object: manager.connection, queue: OperationQueue.main) { (note) in
                self.commandDelegate!.evalJs("cordova.fireDocumentEvent('vpn:state:changed', {state: \(manager.connection.status.rawValue)});")
            }
        }
    }
    
    func stopStatusMonitors() {
        if self.vpnStatusObserver != nil {
            NotificationCenter.default.removeObserver(self.vpnStatusObserver!)
            self.vpnStatusObserver = nil
        }
        
        doWithAppVPNManager() { (manager) in
            NotificationCenter.default.removeObserver(self, name: Notification.Name.NEVPNStatusDidChange, object: manager.connection)
            self.vpnStatusObserverSet = false
        }
    }
}
